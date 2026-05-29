import { applyDecorators } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiOperation,
} from '@nestjs/swagger';

export const ApiCreateResponse = (summary?: string) =>
  applyDecorators(
    ApiOperation({ summary: summary || 'Create a resource' }),
    ApiCreatedResponse({ description: 'Resource created successfully' }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiUpdateResponse = (summary?: string) =>
  applyDecorators(
    ApiOperation({ summary: summary || 'Update a resource' }),
    ApiOkResponse({ description: 'Resource updated successfully' }),
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiBadRequestResponse({ description: 'Validation failed' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiDeleteResponse = (summary?: string) =>
  applyDecorators(
    ApiOperation({ summary: summary || 'Delete a resource' }),
    ApiOkResponse({ description: 'Resource deleted successfully' }),
    ApiNotFoundResponse({ description: 'Resource not found' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );

export const ApiPaginatedResponse = (summary?: string) =>
  applyDecorators(
    ApiOperation({ summary: summary || 'List resources with pagination' }),
    ApiOkResponse({ description: 'Paginated list of resources' }),
    ApiUnauthorizedResponse({ description: 'Unauthorized' }),
  );
