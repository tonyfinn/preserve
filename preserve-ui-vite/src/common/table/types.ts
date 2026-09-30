export interface RowItem<T> {
    id: string;
    selected: boolean;
    data: T;
    dragCount: number;
}

export interface ColumnDef<T, I> {
    title: string;
    field: T;
    renderer: (row: RowItem<I>) => string;
}

export class Column<T, I> {
    def: ColumnDef<T, I>;
    visible: boolean;

    constructor(def: ColumnDef<T, I>, visible: boolean) {
        this.def = def;
        this.visible = visible;
    }
}
