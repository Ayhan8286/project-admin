/**
 * FormInput — Gen Z styled input component.
 * Use this instead of copy-pasting the tailwind inputClass string everywhere.
 *
 * Usage:
 *   <FormInput name="full_name" value={...} onChange={...} placeholder="..." required />
 *   <FormInput as="textarea" name="desc" value={...} onChange={...} />
 */
import * as React from "react";
import { cn } from "@/lib/utils";

// Shared class string — single source of truth
export const INPUT_CLASS =
    "w-full h-12 px-5 bg-accent/10 border border-border rounded-3xl text-sm font-medium text-foreground placeholder:text-muted-foreground/50 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all hover:bg-accent/20";

type BaseProps = {
    label?: string;
    className?: string;
    wrapperClassName?: string;
};

type InputProps = BaseProps &
    React.InputHTMLAttributes<HTMLInputElement> & {
        as?: "input";
    };

type TextareaProps = BaseProps &
    React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
        as: "textarea";
        rows?: number;
    };

type FormInputProps = InputProps | TextareaProps;

export function FormInput(props: FormInputProps) {
    const { label, className, wrapperClassName, as: Tag = "input", ...rest } = props;

    const element =
        Tag === "textarea" ? (
            <textarea
                {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
                className={cn(INPUT_CLASS, "resize-none", className)}
            />
        ) : (
            <input
                {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
                className={cn(INPUT_CLASS, className)}
            />
        );

    if (!label) return element;

    return (
        <div className={cn("space-y-1.5", wrapperClassName)}>
            <label className="text-xs font-bold text-foreground">{label}</label>
            {element}
        </div>
    );
}
