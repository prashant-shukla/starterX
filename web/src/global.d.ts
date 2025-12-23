// Ambient module declarations for non-standard import specifiers used in the repo
declare module 'figma:asset/*';
declare module 'npm:*';
declare module 'jsr:*';
declare module 'https://*';
declare module '*@*';

// Match imports that include a version suffix like "lucide-react@0.487.0" or
// other patterns where package names include an @ and version. This will
// silence module-not-found errors from the TypeScript compiler for these
// generated import specifiers used in the repo.
// Generic pattern for imports that include a version like `package@1.2.3`
declare module "*@*" {
  const x: any;
  export default x;
}

// Scoped packages with optional version segments, e.g. `@radix-ui/react-dialog@1.1.6`
declare module "@*/*@*" {
  const x: any;
  export default x;
}

// Specific common UI libraries that appear versioned in imports
// Treat lucide-react@* as an any-typed module so named icon imports don't error.
declare module "lucide-react@*" {
  const icons: { [key: string]: any };
  export = icons;
}

// Also allow named exports by re-declaring a module shape that supports named
// imports often used in components (e.g. `import { ChevronLeft } from 'lucide-react@0.487.0'`).
declare module "lucide-react@*" {
  export const ChevronLeft: any;
  export const ChevronRight: any;
  export const ChevronLeftIcon: any;
  export const ChevronRightIcon: any;
  export const ChevronUpIcon: any;
  export const ChevronDownIcon: any;
  export const CheckIcon: any;
  export const CheckCircle: any;
  export const CheckCircle2: any;
  export const XIcon: any;
  export const MoreHorizontal: any;
  export const MoreHorizontalIcon: any;
  export const ArrowLeft: any;
  export const ArrowRight: any;
  export const ArrowLeftIcon: any;
  export const ArrowRightIcon: any;
  export const PanelLeftIcon: any;
  export const SearchIcon: any;
  export const MinusIcon: any;
  export const CircleIcon: any;
  export const GripVerticalIcon: any;
  export const PanelLeftIconLegacy: any;
  export default any;
}

// Permissive declarations for other versioned packages referenced in UI components
declare module "@radix-ui/react-accordion@1.2.3" { const x: any; export = x }
declare module "@radix-ui/react-alert-dialog@1.1.6" { const x: any; export = x }
declare module "@radix-ui/react-aspect-ratio@1.1.2" { const x: any; export = x }
declare module "react-day-picker@8.10.1" {
  // Minimal DayPicker type to support ComponentProps<typeof DayPicker>
  export const DayPicker: any;
  export default DayPicker;
}
declare module "embla-carousel-react@8.6.0" {
  // Minimal embla types used by our Carousel component
  export type UseEmblaCarouselType = any;
  export default function useEmblaCarousel(opts?: any, plugins?: any): [
    (node: any) => void,
    UseEmblaCarouselType,
  ];
}
declare module "recharts@2.15.2" {
  // Provide basic named exports and a RechartsPrimitive namespace used by our wrappers
  export const Legend: any;
  export const Tooltip: any;
  export const ResponsiveContainer: any;

  export namespace RechartsPrimitive {
    export type LegendProps = any;
    export type TooltipProps = any;
    export type ResponsiveContainerProps = any;
  }
}
declare module "cmdk@1.1.1" { export const Command: any; export default Command }
declare module "vaul@1.1.2" { export const Drawer: any; export default Drawer }
declare module "react-hook-form@7.55.0" {
  // Provide generic-friendly placeholders for common exports used in the UI layer
  export type FieldValues = Record<string, any>;
  export type FieldPath<T> = keyof T & (string | number | symbol);

  export type ControllerProps<
    TFieldValues extends FieldValues = FieldValues,
    TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
  > = any;

  export const Controller: any;
  export const FormProvider: any;
  export function useFormContext<T = any>(...args: any[]): any;
  export function useFormState<T = any>(...args: any[]): any;
  export default any;
}
declare module "input-otp@1.4.2" { export const OTPInput: any; export const OTPInputContext: any; export default any }
declare module "react-resizable-panels@2.1.7" { const x: any; export = x }
declare module "next-themes@0.4.6" { export function useTheme(...args: any[]): any; export default any }
declare module "sonner@2.0.3" { export const Toaster: any; export type ToasterProps = any; export default any }

// More radix primitives used by UI files
declare module "@radix-ui/react-context-menu@2.2.6" { const x: any; export = x }
declare module "@radix-ui/react-dropdown-menu@2.1.6" { const x: any; export = x }
declare module "@radix-ui/react-hover-card@1.1.6" { const x: any; export = x }
declare module "@radix-ui/react-menubar@1.1.6" { const x: any; export = x }
declare module "@radix-ui/react-navigation-menu@1.2.5" { const x: any; export = x }
declare module "@radix-ui/react-popover@1.1.6" { const x: any; export = x }
declare module "@radix-ui/react-progress@1.1.2" { const x: any; export = x }
declare module "@radix-ui/react-radio-group@1.2.3" { const x: any; export = x }
declare module "@radix-ui/react-slider@1.2.3" { const x: any; export = x }

declare module "class-variance-authority@*" {
  export function cva(...args: any[]): any;
  // Make VariantProps generic so usage like VariantProps<typeof buttonVariants> compiles
  export type VariantProps<T = any> = any;
}

// Wildcard declaration for versioned radix-ui packages (e.g. "@radix-ui/react-dialog@1.1.6")
// Wildcard declaration for versioned radix-ui packages (e.g. "@radix-ui/react-dialog@1.1.6")
declare module "@radix-ui/*@*" {
  const Primitive: any;
  export = Primitive;
}

// Specific helper: ensure the Slot primitive exports a named Slot symbol
declare module "@radix-ui/react-slot@*" {
  export const Slot: any;
  export default Slot;
}

// Explicit declarations for specific Radix packages (versioned import specifiers used in the repo)
declare module "@radix-ui/react-avatar@1.1.3" { const x: any; export = x }
declare module "@radix-ui/react-slot@1.1.2" { export const Slot: any; export default Slot }
declare module "@radix-ui/react-checkbox@1.1.4" { const x: any; export = x }
declare module "@radix-ui/react-collapsible@1.1.3" { const x: any; export = x }
declare module "@radix-ui/react-dialog@1.1.6" { const x: any; export = x }
declare module "@radix-ui/react-label@2.1.2" { const x: any; export = x }
declare module "@radix-ui/react-scroll-area@1.2.3" { const x: any; export = x }
declare module "@radix-ui/react-select@2.1.6" { const x: any; export = x }
declare module "@radix-ui/react-separator@1.1.2" { const x: any; export = x }
declare module "@radix-ui/react-tabs@1.1.3" { const x: any; export = x }
declare module "@radix-ui/react-tooltip@1.1.8" { const x: any; export = x }

// Common static asset extensions
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.svg';

// Allow importing plain CSS files (global styles) as side-effect imports
declare module '*.css';

// Allow importing TSX files without explicit extension in some tooling setups
declare module '*/*.tsx';
