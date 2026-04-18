/**
 * Ambient types for shadcn/ui components written in JSX (from the starter template).
 * Keeps them usable under strict TS without rewriting every file to TSX.
 *
 * If you convert a component to .tsx with explicit types, remove it from here.
 */

declare module '@/components/ui/accordion' {
  import * as React from 'react';
  export const Accordion: React.FC<any>;
  export const AccordionContent: React.FC<any>;
  export const AccordionItem: React.FC<any>;
  export const AccordionTrigger: React.FC<any>;
}

declare module '@/components/ui/alert-dialog' {
  import * as React from 'react';
  export const AlertDialog: React.FC<any>;
  export const AlertDialogAction: React.FC<any>;
  export const AlertDialogCancel: React.FC<any>;
  export const AlertDialogContent: React.FC<any>;
  export const AlertDialogDescription: React.FC<any>;
  export const AlertDialogFooter: React.FC<any>;
  export const AlertDialogHeader: React.FC<any>;
  export const AlertDialogTitle: React.FC<any>;
  export const AlertDialogTrigger: React.FC<any>;
}

declare module '@/components/ui/alert' {
  import * as React from 'react';
  export const Alert: React.FC<any>;
  export const AlertDescription: React.FC<any>;
  export const AlertTitle: React.FC<any>;
}

declare module '@/components/ui/avatar' {
  import * as React from 'react';
  export const Avatar: React.FC<any>;
  export const AvatarFallback: React.FC<any>;
  export const AvatarImage: React.FC<any>;
}

declare module '@/components/ui/badge' {
  import * as React from 'react';
  export const Badge: React.FC<any>;
  export const badgeVariants: any;
}

declare module '@/components/ui/button' {
  import * as React from 'react';
  export const Button: React.FC<any>;
  export const buttonVariants: any;
}

declare module '@/components/ui/card' {
  import * as React from 'react';
  export const Card: React.FC<any>;
  export const CardContent: React.FC<any>;
  export const CardDescription: React.FC<any>;
  export const CardFooter: React.FC<any>;
  export const CardHeader: React.FC<any>;
  export const CardTitle: React.FC<any>;
}

declare module '@/components/ui/checkbox' {
  import * as React from 'react';
  export const Checkbox: React.FC<any>;
}

declare module '@/components/ui/dialog' {
  import * as React from 'react';
  export const Dialog: React.FC<any>;
  export const DialogContent: React.FC<any>;
  export const DialogDescription: React.FC<any>;
  export const DialogFooter: React.FC<any>;
  export const DialogHeader: React.FC<any>;
  export const DialogTitle: React.FC<any>;
  export const DialogTrigger: React.FC<any>;
}

declare module '@/components/ui/dropdown-menu' {
  import * as React from 'react';
  export const DropdownMenu: React.FC<any>;
  export const DropdownMenuContent: React.FC<any>;
  export const DropdownMenuItem: React.FC<any>;
  export const DropdownMenuLabel: React.FC<any>;
  export const DropdownMenuSeparator: React.FC<any>;
  export const DropdownMenuTrigger: React.FC<any>;
}

declare module '@/components/ui/form' {
  import * as React from 'react';
  export const Form: React.FC<any>;
  export const FormControl: React.FC<any>;
  export const FormDescription: React.FC<any>;
  export const FormField: React.FC<any>;
  export const FormItem: React.FC<any>;
  export const FormLabel: React.FC<any>;
  export const FormMessage: React.FC<any>;
}

declare module '@/components/ui/input' {
  import * as React from 'react';
  export const Input: React.FC<any>;
}

declare module '@/components/ui/label' {
  import * as React from 'react';
  export const Label: React.FC<any>;
}

declare module '@/components/ui/popover' {
  import * as React from 'react';
  export const Popover: React.FC<any>;
  export const PopoverContent: React.FC<any>;
  export const PopoverTrigger: React.FC<any>;
}

declare module '@/components/ui/progress' {
  import * as React from 'react';
  export const Progress: React.FC<any>;
}

declare module '@/components/ui/radio-group' {
  import * as React from 'react';
  export const RadioGroup: React.FC<any>;
  export const RadioGroupItem: React.FC<any>;
}

declare module '@/components/ui/scroll-area' {
  import * as React from 'react';
  export const ScrollArea: React.FC<any>;
  export const ScrollBar: React.FC<any>;
}

declare module '@/components/ui/select' {
  import * as React from 'react';
  export const Select: React.FC<any>;
  export const SelectContent: React.FC<any>;
  export const SelectGroup: React.FC<any>;
  export const SelectItem: React.FC<any>;
  export const SelectLabel: React.FC<any>;
  export const SelectSeparator: React.FC<any>;
  export const SelectTrigger: React.FC<any>;
  export const SelectValue: React.FC<any>;
}

declare module '@/components/ui/separator' {
  import * as React from 'react';
  export const Separator: React.FC<any>;
}

declare module '@/components/ui/sheet' {
  import * as React from 'react';
  export const Sheet: React.FC<any>;
  export const SheetContent: React.FC<any>;
  export const SheetDescription: React.FC<any>;
  export const SheetFooter: React.FC<any>;
  export const SheetHeader: React.FC<any>;
  export const SheetTitle: React.FC<any>;
  export const SheetTrigger: React.FC<any>;
}

declare module '@/components/ui/sonner' {
  import * as React from 'react';
  export const Toaster: React.FC<any>;
}

declare module '@/components/ui/switch' {
  import * as React from 'react';
  export const Switch: React.FC<any>;
}

declare module '@/components/ui/table' {
  import * as React from 'react';
  export const Table: React.FC<any>;
  export const TableBody: React.FC<any>;
  export const TableCaption: React.FC<any>;
  export const TableCell: React.FC<any>;
  export const TableFooter: React.FC<any>;
  export const TableHead: React.FC<any>;
  export const TableHeader: React.FC<any>;
  export const TableRow: React.FC<any>;
}

declare module '@/components/ui/tabs' {
  import * as React from 'react';
  export const Tabs: React.FC<any>;
  export const TabsContent: React.FC<any>;
  export const TabsList: React.FC<any>;
  export const TabsTrigger: React.FC<any>;
}

declare module '@/components/ui/textarea' {
  import * as React from 'react';
  export const Textarea: React.FC<any>;
}

declare module '@/components/ui/toast' {
  import * as React from 'react';
  export const Toast: React.FC<any>;
  export const ToastAction: React.FC<any>;
  export const ToastClose: React.FC<any>;
  export const ToastDescription: React.FC<any>;
  export const ToastProvider: React.FC<any>;
  export const ToastTitle: React.FC<any>;
  export const ToastViewport: React.FC<any>;
}

declare module '@/components/ui/toggle' {
  import * as React from 'react';
  export const Toggle: React.FC<any>;
  export const toggleVariants: any;
}

declare module '@/components/ui/tooltip' {
  import * as React from 'react';
  export const Tooltip: React.FC<any>;
  export const TooltipContent: React.FC<any>;
  export const TooltipProvider: React.FC<any>;
  export const TooltipTrigger: React.FC<any>;
}

declare module '@/lib/utils' {
  export function cn(...inputs: Array<string | number | boolean | null | undefined | Record<string, unknown>>): string;
}
