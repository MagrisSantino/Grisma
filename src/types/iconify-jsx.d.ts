export {};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "iconify-icon": import("react").DetailedHTMLProps<
        import("react").HTMLAttributes<HTMLElement> & {
          icon?: string;
          width?: string | number;
          height?: string | number;
          strokeWidth?: string | number;
        },
        HTMLElement
      >;
    }
  }
}
