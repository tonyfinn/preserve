export interface TreeItemCommon<T> {
    id: string;
    name: string;
    type: string;
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

export enum ChildrenLoadState {
    Unloaded,
    Loading,
    Loaded,
}

export interface TreeItemNode<T> extends TreeItemCommon<T> {
    isLeaf: false;
    childrenLoadState: ChildrenLoadState;
    children: Array<TreeItem<T>>;
}

export enum SelectionType {
    Replace,
    Append,
    Extend,
}

export enum TreeItemEventType {
    Selection,
    Expand,
    Activate,
}

export interface TreeItemEvent<T> {
    item: TreeItem<T>;
    parents: Array<TreeItem<T>>;
    type: TreeItemEventType;
}

export interface TreeSelectionEvent<T> extends TreeItemEvent<T> {
    selectType: SelectionType;
    selected: boolean;
    type: TreeItemEventType.Selection;
}

export interface TreeExpandEvent<T> extends TreeItemEvent<T> {
    expanded: boolean;
    type: TreeItemEventType.Expand;
}

export interface TreeActivateEvent<T> extends TreeItemEvent<T> {
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    type: TreeItemEventType.Activate;
}

export type TreeEvent<T> =
    | TreeSelectionEvent<T>
    | TreeExpandEvent<T>
    | TreeActivateEvent<T>;

export type TreeItem<T> = TreeItemNode<T> | TreeItemLeaf<T>;
