import { Injectable } from '@nestjs/common';
import { PurchaseOrdersRepository } from './purchase-orders.repository';
import { InventoryRepository } from '../inventory/inventory.repository';
import {
  CreatePurchaseOrderDto,
  UpdatePurchaseOrderDto,
  ReceivePurchaseOrderDto,
  CreateReorderPurchaseOrderDto,
} from './dto/purchase-order.dto';
import { QueryFilterDto } from '../../common/dto/query-filter.dto';
import { PurchaseOrderStatus, StockMovementType, StockMovementDirection } from '../../common/enums';
import { ResourceNotFoundException, InvalidOperationException } from '../../common/exceptions/app.exception';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly poRepo: PurchaseOrdersRepository,
    private readonly inventoryRepo: InventoryRepository,
    private readonly events: EventEmitter2,
  ) {}

  async create(dto: CreatePurchaseOrderDto, createdBy: string) {
    const orderNumber = await this.poRepo.generateOrderNumber();
    const items = dto.items.map((item) => ({
      ...item,
      totalPrice: item.orderedQuantity * item.unitPrice * (1 + (item.taxPercent || 0) / 100),
    }));
    const subtotal = items.reduce((sum, i) => sum + i.orderedQuantity * i.unitPrice, 0);
    const taxAmount = items.reduce((sum, i) => sum + (i.orderedQuantity * i.unitPrice * (i.taxPercent || 0) / 100), 0);
    const totalAmount = subtotal + taxAmount;

    const po = await this.poRepo.create({
      orderNumber,
      supplierId: dto.supplierId,
      orderDate: new Date(dto.orderDate),
      expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
      notes: dto.notes,
      subtotal,
      taxAmount,
      totalAmount,
      items: items as any,
      createdById: createdBy,
      createdBy,
    });

    this.events.emit('purchase-order.created', { po, createdBy });
    return po;
  }

  async createFromReorderSuggestions(dto: CreateReorderPurchaseOrderDto, createdBy: string) {
    const suggestions = await this.inventoryRepo.getReorderSuggestions(200, dto.supplierId);
    const selectedSuggestions = dto.medicineIds?.length
      ? suggestions.filter((suggestion) => dto.medicineIds?.includes(suggestion.id))
      : suggestions;

    if (selectedSuggestions.length === 0) {
      throw new InvalidOperationException('No reorder suggestions available for the selected supplier or medicines');
    }

    const items = await Promise.all(
      selectedSuggestions.map(async (suggestion) => {
        const medicine = await this.inventoryRepo.findMedicineById(suggestion.id);
        if (!medicine) {
          throw new ResourceNotFoundException('Medicine', suggestion.id);
        }

        return {
          medicineId: medicine.id,
          medicineName: medicine.name,
          orderedQuantity: suggestion.suggestedOrderQuantity,
          unitPrice: Number(medicine.buyingPrice || 0),
          taxPercent: Number(medicine.taxPercent || 0),
          batchNumber: medicine.batchNumber,
          expiryDate: medicine.expiryDate ? new Date(medicine.expiryDate) : undefined,
        };
      }),
    );

    const orderDate = dto.orderDate ? new Date(dto.orderDate) : new Date();
    const expectedDeliveryDate = dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined;
    const subtotal = items.reduce((sum, item) => sum + item.orderedQuantity * item.unitPrice, 0);
    const taxAmount = items.reduce((sum, item) => sum + (item.orderedQuantity * item.unitPrice * (item.taxPercent || 0)) / 100, 0);
    const totalAmount = subtotal + taxAmount;

    const po = await this.poRepo.create({
      orderNumber: await this.poRepo.generateOrderNumber(),
      supplierId: dto.supplierId,
      orderDate,
      expectedDeliveryDate,
      notes: dto.notes || 'Auto-generated from reorder suggestions',
      subtotal,
      taxAmount,
      totalAmount,
      items: items as any,
      createdById: createdBy,
      createdBy,
      status: PurchaseOrderStatus.DRAFT,
    });

    this.events.emit('purchase-order.created', { po, createdBy, source: 'reorder-suggestions' });
    return po;
  }

  async findAll(filter: QueryFilterDto) {
    return this.poRepo.findAll(filter);
  }

  async findOne(id: string) {
    const po = await this.poRepo.findById(id);
    if (!po) throw new ResourceNotFoundException('Purchase Order', id);
    return po;
  }

  async update(id: string, dto: UpdatePurchaseOrderDto, updatedBy: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED || po.status === PurchaseOrderStatus.CANCELLED) {
      throw new InvalidOperationException(`Cannot update a ${po.status} purchase order`);
    }
    return this.poRepo.update(id, { ...dto, updatedBy } as any);
  }

  async receivePurchaseOrder(id: string, dto: ReceivePurchaseOrderDto, receivedBy: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.CANCELLED) {
      throw new InvalidOperationException('Cannot receive a cancelled purchase order');
    }

    let allReceived = true;
    let anyReceived = false;

    for (const item of po.items) {
      const receivedQty = dto.receivedItems[item.id] ?? 0;
      if (receivedQty > 0) {
        anyReceived = true;
        const newReceivedQty = item.receivedQuantity + receivedQty;
        await this.poRepo.updateItem(item.id, { receivedQuantity: newReceivedQty });

        // Update stock
        const medicine = await this.inventoryRepo.findMedicineById(item.medicineId);
        if (medicine) {
          const beforeQty = medicine.stockQuantity;
          const afterQty = beforeQty + receivedQty;
          await this.inventoryRepo.updateStock(item.medicineId, afterQty);
          await this.inventoryRepo.recordMovement({
            medicineId: item.medicineId,
            type: StockMovementType.PURCHASE,
            direction: StockMovementDirection.IN,
            quantity: receivedQty,
            beforeQuantity: beforeQty,
            afterQuantity: afterQty,
            referenceId: po.id,
            referenceType: 'purchase_order',
            batchNumber: item.batchNumber,
            unitCost: Number(item.unitPrice),
            performedBy: receivedBy,
          });
        }
      }
      if (item.receivedQuantity + (dto.receivedItems[item.id] ?? 0) < item.orderedQuantity) {
        allReceived = false;
      }
    }

    const newStatus = allReceived
      ? PurchaseOrderStatus.RECEIVED
      : anyReceived
      ? PurchaseOrderStatus.PARTIALLY_RECEIVED
      : po.status;

    return this.poRepo.update(id, {
      status: newStatus,
      receivedDate: dto.receivedDate ? new Date(dto.receivedDate) : new Date(),
      updatedBy: receivedBy,
    } as any);
  }

  async cancel(id: string, updatedBy: string) {
    const po = await this.findOne(id);
    if (po.status === PurchaseOrderStatus.RECEIVED) {
      throw new InvalidOperationException('Cannot cancel a received purchase order');
    }
    return this.poRepo.update(id, { status: PurchaseOrderStatus.CANCELLED, updatedBy } as any);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.poRepo.softDelete(id);
    return { message: 'Purchase order deleted' };
  }
}
