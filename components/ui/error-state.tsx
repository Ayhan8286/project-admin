/**
 * ErrorState — reusable error card for query failures.
 *
 * Usage:
 *   if (isError) return <ErrorState message="Failed to load students." onRetry={refetch} />;
 */
import { AlertTriangle } from "lucide-react";

interface ErrorStateProps {
    message?: string;
    onRetry?: () => void;
}

export function ErrorState({
    message = "Something went wrong. Please try again.",
    onRetry,
}: ErrorStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="size-14 rounded-3xl bg-destructive/10 border border-destructive/20 flex items-center justify-center mb-4">
                <AlertTriangle className="h-6 w-6 text-destructive" />
            </div>
            <p className="text-base font-black text-foreground mb-1">Oops!</p>
            <p className="text-sm text-muted-foreground font-medium max-w-xs">{message}</p>
            {onRetry && (
                <button
                    onClick={onRetry}
                    className="mt-5 px-5 py-2.5 rounded-full border border-border text-sm font-bold text-foreground hover:bg-accent transition-all"
                >
                    Try Again
                </button>
            )}
        </div>
    );
}

/**
 * EmptyState — reusable empty content placeholder.
 *
 * Usage:
 *   <EmptyState icon={Users} title="No students yet" description="Add a student to get started." />
 */
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon?: LucideIcon;
    title?: string;
    description?: string;
    action?: React.ReactNode;
}

export function EmptyState({
    icon: Icon,
    title = "Nothing here yet",
    description,
    action,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            {Icon && (
                <div className="size-14 rounded-3xl bg-accent/50 border border-border flex items-center justify-center mb-4">
                    <Icon className="h-6 w-6 text-muted-foreground" />
                </div>
            )}
            <p className="text-base font-black text-foreground mb-1">{title}</p>
            {description && (
                <p className="text-sm text-muted-foreground font-medium max-w-xs">{description}</p>
            )}
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
