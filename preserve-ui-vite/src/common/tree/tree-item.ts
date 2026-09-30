export interface TreeItemCommon<T> {
    id: string;
    name: string;
    type: string;
    expanded: boolean;
    isLeaf: boolean;
    selected: boolean;
    focused: boolean;
    childrenSelected: boolean;
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
    Activate,
    Expand,
    Focus,
    Selection,
}

export interface TreeItemEvent<T> {
    item: TreeItem<T>;
    parents: Array<TreeItemNode<T>>;
    type: TreeItemEventType;
}

export interface TreeActivateEvent<T> extends TreeItemEvent<T> {
    shiftKey: boolean;
    altKey: boolean;
    ctrlKey: boolean;
    type: TreeItemEventType.Activate;
}

export interface TreeExpandEvent<T> extends TreeItemEvent<T> {
    expanded: boolean;
    type: TreeItemEventType.Expand;
}

export interface TreeFocusEvent<T> extends TreeItemEvent<T> {
    type: TreeItemEventType.Focus;
}

export interface TreeSelectionEvent<T> extends TreeItemEvent<T> {
    selectType: SelectionType;
    selected: boolean;
    type: TreeItemEventType.Selection;
}

export type TreeEvent<T> =
    | TreeActivateEvent<T>
    | TreeExpandEvent<T>
    | TreeFocusEvent<T>
    | TreeSelectionEvent<T>;

export type TreeItem<T> = TreeItemNode<T> | TreeItemLeaf<T>;

export function buildTreeLeaf<T>(
    id: string,
    name: string,
    type: string,
    data: T
): TreeItemLeaf<T> {
    return {
        id,
        name,
        type,
        data,
        isLeaf: true,
        childrenSelected: false,
        expanded: false,
        focused: false,
        selected: false,
    };
}

export function buildTreeNode<T>(
    id: string,
    name: string,
    type: string,
    data: T,
    children?: Array<TreeItem<T>>
): TreeItemNode<T> {
    return {
        id,
        name,
        type,
        data,
        children: children || [],
        isLeaf: false,
        childrenLoadState:
            children === null || children === undefined
                ? ChildrenLoadState.Unloaded
                : ChildrenLoadState.Loaded,
        childrenSelected: false,
        expanded: false,
        focused: false,
        selected: false,
    };
}
