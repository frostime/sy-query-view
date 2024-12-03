interface IDataView {
    render: () => void;
}

interface ICustomView {
    use: () => {
        init: (dv: IDataView, ...args: any[]) => HTMLElement; //Create the user custom view.
        dispose?: (dv: IDataView) => void;  // Unmount hook for the user custom view.
    },
    alias?: string[]; // alias name for the custom view
}

interface IUserCustom {
    [key: string]: ICustomView;
}
