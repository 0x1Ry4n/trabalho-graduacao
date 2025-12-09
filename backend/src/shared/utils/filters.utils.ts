type FieldTransformer<T> = (value: any) => T;

interface FieldConfig {
    transform?: FieldTransformer<any>;
}

type FieldsConfig<T> = Partial<Record<keyof T, FieldConfig>>;

export function buildFilters<TFilters, TSearch extends Record<string, any>>(
    rawFields: Record<string, any>,
    fieldsConfig?: FieldsConfig<TSearch>
): TFilters | undefined {
    const search = Object.entries(rawFields).reduce((acc, [key, value]) => {
        if (value === undefined || value === null || value === '') return acc;

        const config = fieldsConfig?.[key as keyof TSearch];
        const transformed = config?.transform ? config.transform(value) : value;

        return { ...acc, [key]: transformed };
    }, {} as TSearch);

    return Object.keys(search).length > 0
        ? ({ search } as TFilters)
        : undefined;
}