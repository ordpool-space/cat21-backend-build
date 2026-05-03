export declare const jsonColumn: <T>() => {
    (): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "MySqlCustomColumn";
        data: T;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TConfig extends Record<string, any>>(fieldConfig?: TConfig | undefined): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
        name: "";
        dataType: "custom";
        columnType: "MySqlCustomColumn";
        data: T;
        driverParam: string;
        enumValues: undefined;
    }>;
    <TName extends string>(dbName: TName, fieldConfig?: unknown): import("drizzle-orm/mysql-core").MySqlCustomColumnBuilder<{
        name: TName;
        dataType: "custom";
        columnType: "MySqlCustomColumn";
        data: T;
        driverParam: string;
        enumValues: undefined;
    }>;
};
