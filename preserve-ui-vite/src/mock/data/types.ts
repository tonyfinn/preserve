import { BaseItemDto } from '@jellyfin/client-axios';

/// Handle enum values stringified for transport by overriding their types with strings
type TransferItemDtoBase = Omit<Partial<BaseItemDto>, 'LocationType'>;

export interface TransferItemDto extends TransferItemDtoBase {
    LocationType?: string;
}
