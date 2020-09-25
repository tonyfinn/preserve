export interface RowItem<T> {
    id: string;
    selected: boolean;
    data: T;
    dragCount: number;
}

export interface ColumnDef<T> {
    title: string;
    visible: boolean;
    renderer: (row: RowItem<T>) => string;
}
