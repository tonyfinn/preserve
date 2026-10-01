import { type BaseItemDto } from '@jellyfin/sdk/lib/generated-client';

/// Handle enum values stringified for transport by overriding their types with strings
type TransferItemDtoBase = Omit<Partial<BaseItemDto>, 'LocationType'>;

export interface TransferItemDto extends TransferItemDtoBase {
    LocationType?: string;
}
