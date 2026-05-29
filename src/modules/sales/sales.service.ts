import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { SalesRepository } from './sales.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import { CustomersRepository } from '../customers/customers.repository';
import { CreateSaleDto, RefundSaleDto } from './dto/sale.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { SaleStatus, StockMovementType, StockMovementDirection, PaymentStatus } from '../../common/enums';
import {
  ResourceNotFoundException,
  InsufficientStockException,
  MedicineExpiredException,
  InvalidOperationException,
} from '../../common/exceptions/app.exception';

@Injectable()
export class SalesService {
  constructor(
    private readonly salesRepo: SalesRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly customersRepo: CustomersRepository,
    private readonly events: EventEmitter2,
  ) {}

  async createSale(dto: CreateSaleDto, cashierId: string) {
    // Validate stock and calculate totals
    let subtotal = 0;
    let taxAmount = 0;
    let discountAmount = dto.discountAmount || 0;

    const saleItems: any[] = [];

    for (const item of dto.items) {
      const medicine = await this.inventoryRepo.findMedicineById(item.medicineId);
      if (!medicine) throw new ResourceNotFoundException('Medicine', item.medicineId);

      if (medicine.isExpired) {
        throw new MedicineExpiredException(medicine.name, medicine.expiryDate!);
      }

      if (medicine.stockQuantity < item.quantity) {
        throw new InsufficientStockException(medicine.name, medicine.stockQuantity, item.quantity);
      }

      const itemDiscountAmt = (item.unitPrice * item.quantity * (item.discountPercent || 0)) / 100;
      const itemTaxable = item.unitPrice * item.quantity - itemDiscountAmt;
      const itemTaxAmt = (itemTaxable * (item.taxPercent || 0)) / 100;
      const itemTotal = itemTaxable + itemTaxAmt;

      subtotal += item.unitPrice * item.quantity;
      taxAmount += itemTaxAmt;

      saleItems.push({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        medicineSku: item.medicineSku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discountPercent: item.discountPercent || 0,
        discountAmount: itemDiscountAmt,
        taxPercent: item.taxPercent || 0,
        taxAmount: itemTaxAmt,
        totalPrice: itemTotal,
        batchNumber: item.batchNumber,
        expiryDate: medicine.expiryDate,
      });
    }

    const totalAmount = subtotal - discountAmount + taxAmount;
    const changeAmount = Math.max(0, dto.paidAmount - totalAmount);
    const paymentStatus = dto.paidAmount >= totalAmount ? PaymentStatus.PAID : PaymentStatus.PARTIAL;
    const loyaltyPointsEarned = Math.floor(totalAmount / 100); // 1 point per 100

    const invoiceNumber = await this.salesRepo.generateInvoiceNumber();

    const sale = await this.salesRepo.create({
      invoiceNumber,
      customerId: dto.customerId,
      prescriptionId: dto.prescriptionId,
      paymentMethod: dto.paymentMethod,
      paidAmount: dto.paidAmount,
      subtotal,
      discountAmount,
      taxAmount,
      totalAmount,
      changeAmount,
      paymentStatus,
      cashierId,
      notes: dto.notes,
      loyaltyPointsEarned,
      items: saleItems,
      createdBy: cashierId,
    });

    // Deduct stock for each item
    for (const item of dto.items) {
      const medicine = await this.inventoryRepo.findMedicineById(item.medicineId);
      if (medicine) {
        const beforeQty = medicine.stockQuantity;
        const afterQty = beforeQty - item.quantity;
        await this.inventoryRepo.updateStock(item.medicineId, afterQty);
        await this.inventoryRepo.recordMovement({
          medicineId: item.medicineId,
          type: StockMovementType.SALE,
          direction: StockMovementDirection.OUT,
          quantity: item.quantity,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          referenceId: sale.id,
          referenceType: 'sale',
          performedBy: cashierId,
        });

        // Low stock alert
        if (afterQty <= medicine.minimumStock) {
          this.events.emit('stock.low', { medicine: { ...medicine, stockQuantity: afterQty } });
        }
      }
    }

    // Add loyalty points to customer
    if (dto.customerId && loyaltyPointsEarned > 0) {
      await this.customersRepo.addLoyaltyPoints(dto.customerId, loyaltyPointsEarned);
    }

    this.events.emit('sale.completed', { sale, cashierId });
    return sale;
  }

  async findAll(filter: QueryFilterDto) {
    return this.salesRepo.findAll(filter);
  }

  async findOne(id: string) {
    const sale = await this.salesRepo.findById(id);
    if (!sale) throw new ResourceNotFoundException('Sale', id);
    return sale;
  }

  async refundSale(id: string, dto: RefundSaleDto, processedBy: string) {
    const sale = await this.findOne(id);

    if (sale.status === SaleStatus.CANCELLED) {
      throw new InvalidOperationException('Cannot refund a cancelled sale');
    }

    let totalRefundAmount = 0;

    for (const item of sale.items) {
      const refundQty = dto.refundItems[item.id] ?? 0;
      if (refundQty === 0) continue;

      const maxRefundable = item.quantity - item.returnedQuantity;
      if (refundQty > maxRefundable) {
        throw new InvalidOperationException(
          `Cannot refund more than ${maxRefundable} units of ${item.medicineName}`,
        );
      }

      const refundItemAmt = (Number(item.totalPrice) / item.quantity) * refundQty;
      totalRefundAmount += refundItemAmt;

      await this.salesRepo.updateItem(item.id, {
        returnedQuantity: item.returnedQuantity + refundQty,
      });

      // Restore stock
      const medicine = await this.inventoryRepo.findMedicineById(item.medicineId);
      if (medicine) {
        const beforeQty = medicine.stockQuantity;
        const afterQty = beforeQty + refundQty;
        await this.inventoryRepo.updateStock(item.medicineId, afterQty);
        await this.inventoryRepo.recordMovement({
          medicineId: item.medicineId,
          type: StockMovementType.RETURN,
          direction: StockMovementDirection.IN,
          quantity: refundQty,
          beforeQuantity: beforeQty,
          afterQuantity: afterQty,
          referenceId: sale.id,
          referenceType: 'sale_refund',
          performedBy: processedBy,
        });
      }
    }

    const newRefundTotal = Number(sale.refundAmount) + totalRefundAmount;
    const newStatus =
      newRefundTotal >= Number(sale.totalAmount)
        ? SaleStatus.REFUNDED
        : SaleStatus.PARTIALLY_REFUNDED;

    return this.salesRepo.update(id, {
      status: newStatus,
      refundAmount: newRefundTotal,
      refundReason: dto.reason,
      updatedBy: processedBy,
    } as any);
  }

  async getDailySummary(date?: Date) {
    return this.salesRepo.getDailySales(date || new Date());
  }

  async getTopSellingMedicines(limit = 10) {
    return this.salesRepo.getTopSellingMedicines(limit);
  }
}
