export interface TreeItemCommon<T> {
    id: string;
    name: string;
    expanded: boolean;
    isLeaf: boolean;
    selected: boolean;
    childrenSelected: boolean;
    visible: boolean;
    data: T;
}

export interface TreeItemLeaf<T> extends TreeItemCommon<T> {
    isLeaf: true;
}

export interface TreeItemNode<T> extends TreeItemCommon<T> {
    isLeaf: false;
    children: Array<TreeItem<T>>;
}

export enum SelectionType {
    Replace,
    Append,
    Extend,
}

export interface TreeItemEvent<T> {
    item: TreeItem<T>;
}

export interface SelectionEvent<T> extends TreeItemEvent<T> {
    selectType: SelectionType;
    selected: boolean;
}

export interface ExpandEvent<T> extends TreeItemEvent<T> {
    expanded: boolean;
}

export type TreeItem<T> = TreeItemNode<T> | TreeItemLeaf<T>;
