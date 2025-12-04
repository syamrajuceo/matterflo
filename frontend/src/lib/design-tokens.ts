/**
 * Design Tokens for ERP Builder
 * 
 * This file documents the design system tokens used throughout the application.
 * All components should use these semantic tokens for consistency.
 */

// ============================================================================
// COLORS - Use Semantic Tokens Only
// ============================================================================

export const SEMANTIC_COLORS = {
  // Backgrounds
  background: 'bg-background',           // Main app background
  card: 'bg-card',                      // Cards, panels, modals
  muted: 'bg-muted',                    // Subtle backgrounds
  accent: 'bg-accent',                  // Accent backgrounds
  
  // Text
  foreground: 'text-foreground',        // Main text color
  mutedForeground: 'text-muted-foreground', // Secondary text
  
  // Actions
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
  
  // Borders
  border: 'border-border',
  
  // Special
  ring: 'ring-ring',
} as const;

// ============================================================================
// SPACING SCALE - 8px Grid System
// ============================================================================

export const SPACING = {
  // Gaps (between elements)
  gapTight: 'gap-2',        // 8px  - Icons + text, tight layouts
  gapDefault: 'gap-3',      // 12px - Default spacing between elements
  gapComfortable: 'gap-4',  // 16px - Comfortable spacing
  gapSection: 'gap-6',      // 24px - Between major sections
  gapLarge: 'gap-8',        // 32px - Large sections
  
  // Padding (internal spacing)
  pTight: 'p-3',           // 12px - Tight padding
  pDefault: 'p-4',         // 16px - Default padding
  pGenerous: 'p-6',        // 24px - Generous padding
  pXl: 'p-8',              // 32px - Extra large padding
  
  // Horizontal padding
  pxTight: 'px-3',         // 12px
  pxDefault: 'px-4',       // 16px
  pxComfortable: 'px-5',   // 20px
  pxGenerous: 'px-6',      // 24px
  
  // Vertical padding
  pyTight: 'py-2',         // 8px
  pyDefault: 'py-2.5',     // 10px
  pyComfortable: 'py-3',   // 12px
  pyGenerous: 'py-4',      // 16px
} as const;

// ============================================================================
// TYPOGRAPHY SCALE
// ============================================================================

export const TYPOGRAPHY = {
  // Page titles
  pageTitle: 'text-3xl font-bold tracking-tight',                    // 30px
  pageTitleLarge: 'text-3xl md:text-4xl font-bold tracking-tight',  // 30-36px responsive
  
  // Section headings
  sectionHeading: 'text-2xl font-bold tracking-tight',    // 24px
  sectionTitle: 'text-xl font-semibold',                  // 20px
  
  // Card/Component titles
  cardTitle: 'text-lg font-semibold',                     // 18px
  componentTitle: 'text-base font-semibold',              // 16px
  
  // Body text (DEFAULT - use everywhere)
  bodyDefault: 'text-sm',                                 // 14px - PRIMARY BODY TEXT
  bodyLarge: 'text-base',                                 // 16px - Large body text
  
  // Labels and captions
  label: 'text-sm font-medium',                           // 14px - Form labels
  caption: 'text-xs text-muted-foreground',               // 12px - Captions, metadata
  tiny: 'text-xs',                                        // 12px - Smallest readable text
  
  // NEVER use text-[10px] - too small to read
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const COMPONENT_SIZES = {
  // Buttons
  button: {
    default: 'h-10',      // 40px - Standard button height
    sm: 'h-9',            // 36px - Small button
    lg: 'h-11',           // 44px - Large button (CTAs)
  },
  
  // Inputs
  input: {
    default: 'h-10',      // 40px - All inputs should be this height
  },
  
  // Icons
  icon: {
    inline: 'size-4',     // 16px - Icons in text/buttons
    standard: 'size-5',   // 20px - Standard UI icons
    prominent: 'size-6',  // 24px - Prominent icons
    large: 'size-8',      // 32px - Large feature icons
  },
  
  // Avatars
  avatar: {
    sm: 'size-8',         // 32px
    default: 'size-9',    // 36px
    lg: 'size-10',        // 40px
  },
} as const;

// ============================================================================
// SHADOWS
// ============================================================================

export const SHADOWS = {
  subtle: 'shadow-sm',              // Subtle hint of depth
  default: 'shadow-md',             // Default cards and components
  elevated: 'shadow-lg',            // Hover states, elevated elements
  modal: 'shadow-xl',               // Modals, popovers, dropdowns
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const RADIUS = {
  sm: 'rounded-md',                 // 6px - Small elements
  default: 'rounded-lg',            // 10px - Default (buttons, inputs, cards)
  lg: 'rounded-xl',                 // 12px - Large cards
  full: 'rounded-full',             // Circular
} as const;

// ============================================================================
// TRANSITIONS
// ============================================================================

export const TRANSITIONS = {
  fast: 'transition-all duration-150',      // Quick interactions
  default: 'transition-all duration-200',   // Default transitions
  smooth: 'transition-all duration-300',    // Smooth animations
  
  // Specific properties
  colors: 'transition-colors duration-200',
  transform: 'transition-transform duration-200',
  opacity: 'transition-opacity duration-200',
  shadow: 'transition-shadow duration-200',
} as const;

// ============================================================================
// LAYOUT CONSTANTS
// ============================================================================

export const LAYOUT = {
  // Sidebar widths
  sidebarCollapsed: 'w-16',         // 64px - Icon-only sidebar
  sidebarDefault: 'w-64',           // 256px - Default sidebar
  sidebarWide: 'w-80',              // 320px - Wide sidebar (properties panels)
  
  // Header heights
  headerHeight: 'h-16',             // 64px - All headers should be this height
  
  // Content padding
  contentPadding: 'p-8',            // 32px - Main content area padding
  contentPaddingMobile: 'p-4',     // 16px - Mobile content padding
} as const;

// ============================================================================
// HOVER & FOCUS STATES
// ============================================================================

export const STATES = {
  // Hover effects
  hoverBg: 'hover:bg-accent',
  hoverText: 'hover:text-foreground',
  hoverBorder: 'hover:border-border/80',
  hoverShadow: 'hover:shadow-lg',
  hoverScale: 'hover:scale-[1.02]',
  
  // Focus states
  focusRing: 'focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:ring-offset-2',
  
  // Active states
  activeScale: 'active:scale-[0.98]',
  
  // Disabled states
  disabled: 'disabled:pointer-events-none disabled:opacity-50',
} as const;

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Button Example:
 * ```tsx
 * <button className="h-10 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 hover:shadow-md transition-all duration-200 active:scale-[0.98]">
 *   Click me
 * </button>
 * ```
 * 
 * Card Example:
 * ```tsx
 * <div className="rounded-xl border border-border/50 bg-card shadow-md hover:shadow-lg hover:border-border transition-all duration-200 p-6">
 *   Card content
 * </div>
 * ```
 * 
 * Input Example:
 * ```tsx
 * <input className="h-10 w-full rounded-lg border border-border bg-transparent px-3 py-2 text-sm shadow-sm transition-all duration-200 focus-visible:ring-2 focus-visible:ring-ring/50 hover:border-border/80" />
 * ```
 * 
 * Page Layout Example:
 * ```tsx
 * <div className="space-y-8">
 *   <div className="space-y-3">
 *     <h1 className="text-3xl font-bold tracking-tight">Page Title</h1>
 *     <p className="text-base text-muted-foreground">Page description</p>
 *   </div>
 *   
 *   <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
 *     // Cards here
 *   </div>
 * </div>
 * ```
 */

// ============================================================================
// ANTI-PATTERNS - DO NOT USE
// ============================================================================

/**
 * ❌ DO NOT USE:
 * - bg-white, bg-slate-100, text-slate-900 (use semantic tokens instead)
 * - gap-1, p-2 (too small, use gap-3 and p-4 minimum)
 * - h-9 for buttons (use h-10)
 * - h-9 for inputs (use h-10)
 * - text-[10px] (too small, use text-xs minimum)
 * - text-4xl for page titles (use text-3xl)
 * - Negative margins like -m-6 (fix parent layout instead)
 * - Magic numbers like calc(100vh-3.5rem) (use flex layouts)
 * - Inconsistent icon sizes (use size-4, size-5, size-6)
 * 
 * ✅ DO USE:
 * - Semantic color tokens (bg-card, text-foreground, etc.)
 * - Consistent spacing (gap-3, gap-4, p-4, p-6)
 * - Standard component sizes (h-10 for buttons/inputs)
 * - Typography scale (text-sm for body, text-3xl for titles)
 * - Transitions on all interactive elements
 * - Focus states for accessibility
 */

export default {
  SEMANTIC_COLORS,
  SPACING,
  TYPOGRAPHY,
  COMPONENT_SIZES,
  SHADOWS,
  RADIUS,
  TRANSITIONS,
  LAYOUT,
  STATES,
};

