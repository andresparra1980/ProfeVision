declare module '@/components/ui/form' {
  import * as React from 'react';
  import { ControllerProps, FieldPath, FieldValues } from 'react-hook-form';

  export const Form: React.FC<React.PropsWithChildren<Record<string, unknown>>>;
  export const FormItem: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const FormLabel: React.FC<React.LabelHTMLAttributes<HTMLLabelElement>>;
  export const FormControl: React.FC<React.HTMLAttributes<HTMLDivElement>>;
  export const FormDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  export const FormMessage: React.FC<React.HTMLAttributes<HTMLParagraphElement>>;
  export const FormField: <
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
  >(
    _props: ControllerProps<TFieldValues, TName>
  ) => React.ReactElement;
  export const useFormField: () => Record<string, unknown>;
}
