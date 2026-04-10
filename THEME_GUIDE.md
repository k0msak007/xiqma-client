# Xiqma Design System & Theme Guide

This document provides a complete reference for the visual design system used in the Xiqma client project. Use it to ensure new features, pages, and components remain visually consistent with the existing codebase.

---

## Tech Stack (Styling)

| Tool | Version | Purpose |
|------|---------|---------|
| Tailwind CSS | v4.2.0 | Utility-first CSS framework |
| `tw-animate-css` | latest | Animation utilities |
| Radix UI | v1.x | Headless accessible primitives |
| `class-variance-authority` (CVA) | latest | Variant-based component styling |
| `clsx` + `tailwind-merge` | latest | Safe class merging via `cn()` |
| `next-themes` | v0.4.6 | Dark/light mode management |
| `lucide-react` | latest | Icon library |
| `Geist` / `Geist Mono` | latest | Font families |

**Key utility:** All components use a `cn()` helper from `@/lib/utils`:
```ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

---

## Design Language

**Style:** Clean, minimal, modern dark-mode-first design
- Flat design with light shadows for depth
- Generous whitespace and clear typography hierarchy
- Dark-mode default; light mode as secondary
- Accessible (WCAG-compliant focus rings, aria states)
- Component-based with Radix UI primitives
- Data-dense but not cluttered (task management UI)

---

## Color System

All colors are defined as CSS variables in `app/globals.css` using **OKLch** color space. They are mapped to Tailwind via `@theme inline` in Tailwind v4.

### Light Mode (`:root`)

```css
--background:          oklch(1 0 0);           /* pure white */
--foreground:          oklch(0.145 0 0);        /* dark charcoal */
--card:                oklch(1 0 0);            /* white */
--card-foreground:     oklch(0.145 0 0);        /* dark charcoal */
--popover:             oklch(1 0 0);
--popover-foreground:  oklch(0.145 0 0);
--primary:             oklch(0.205 0 0);        /* dark */
--primary-foreground:  oklch(0.985 0 0);        /* near white */
--secondary:           oklch(0.97 0 0);         /* off-white */
--secondary-foreground:oklch(0.205 0 0);
--muted:               oklch(0.97 0 0);
--muted-foreground:    oklch(0.556 0 0);        /* medium gray */
--accent:              oklch(0.97 0 0);
--accent-foreground:   oklch(0.205 0 0);
--destructive:         oklch(0.577 0.245 27.325);  /* red-orange */
--border:              oklch(0.922 0 0);        /* light gray */
--input:               oklch(0.922 0 0);
--ring:                oklch(0.708 0 0);
--radius:              0.625rem;               /* 10px base */
```

### Dark Mode (`.dark`)

```css
--background:          oklch(0.13 0.01 260);    /* very dark blue */
--foreground:          oklch(0.985 0 0);        /* near white */
--card:                oklch(0.16 0.01 260);    /* dark blue */
--card-foreground:     oklch(0.985 0 0);
--popover:             oklch(0.16 0.01 260);
--popover-foreground:  oklch(0.985 0 0);
--primary:             oklch(0.65 0.19 250);    /* vibrant blue */
--primary-foreground:  oklch(0.985 0 0);
--secondary:           oklch(0.22 0.01 260);    /* dark blue */
--secondary-foreground:oklch(0.985 0 0);
--muted:               oklch(0.22 0.01 260);
--muted-foreground:    oklch(0.65 0.02 260);    /* soft blue-gray */
--accent:              oklch(0.22 0.01 260);
--accent-foreground:   oklch(0.985 0 0);
--destructive:         oklch(0.55 0.2 25);      /* red */
--destructive-foreground: oklch(0.985 0 0);
--border:              oklch(0.25 0.01 260);    /* dark blue-gray */
--input:               oklch(0.25 0.01 260);
--ring:                oklch(0.65 0.19 250);    /* vibrant blue */
```

### Sidebar Colors (Dark Mode)

```css
--sidebar:             oklch(0.11 0.01 260);    /* darkest blue */
--sidebar-foreground:  oklch(0.985 0 0);
--sidebar-primary:     oklch(0.65 0.19 250);
--sidebar-primary-foreground: oklch(0.985 0 0);
--sidebar-accent:      oklch(0.2 0.01 260);
--sidebar-accent-foreground:  oklch(0.985 0 0);
--sidebar-border:      oklch(0.22 0.01 260);
--sidebar-ring:        oklch(0.65 0.19 250);
```

### Chart Colors

| Token | Light | Dark |
|-------|-------|------|
| `--chart-1` | `oklch(0.646 0.222 41.116)` orange | `oklch(0.65 0.19 250)` blue |
| `--chart-2` | `oklch(0.6 0.118 184.704)` teal | `oklch(0.7 0.17 160)` cyan |
| `--chart-3` | `oklch(0.398 0.07 227.392)` slate | `oklch(0.75 0.18 70)` yellow |
| `--chart-4` | `oklch(0.828 0.189 84.429)` yellow | `oklch(0.65 0.25 300)` pink |
| `--chart-5` | `oklch(0.769 0.188 70.08)` amber | `oklch(0.65 0.24 15)` red |

### How to Use Colors in Code

Always use semantic tokens, never hardcoded colors:
```tsx
// CORRECT
<div className="bg-background text-foreground border-border" />
<div className="bg-card text-card-foreground" />
<div className="text-muted-foreground" />
<div className="bg-primary text-primary-foreground" />

// WRONG - do not use
<div className="bg-gray-900 text-white" />
```

---

## Typography

### Font Families

```css
--font-sans: 'Geist', 'Geist Fallback';   /* body, UI text */
--font-mono: 'Geist Mono', 'Geist Mono Fallback';  /* code, monospace */
```

Body tag: `className="font-sans antialiased"`

### Sizes Used in Project

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Metadata, hints, shortcuts, timestamps |
| `text-sm` | 14px | Default UI text, button labels, form labels |
| `text-base` | 16px | Input values, content text |
| `text-lg` | 18px | Section headings |
| `text-xl` | 20px | Page titles |
| `text-2xl`+ | 24px+ | Dashboard stats, hero numbers |

### Weights

| Class | Weight | Usage |
|-------|--------|-------|
| `font-normal` | 400 | Body text |
| `font-medium` | 500 | Labels, buttons, nav items |
| `font-semibold` | 600 | Card titles, headings |
| `font-bold` | 700 | Important headings, stats |

### Text Color Roles

```tsx
text-foreground        // primary readable text
text-muted-foreground  // secondary/supporting text
text-card-foreground   // text inside cards
text-primary           // brand accent text
text-destructive       // error/delete text
```

---

## Spacing System

Based on Tailwind's default 4px scale. Common values used:

| Tailwind | Value | Usage |
|----------|-------|-------|
| `p-1` | 4px | Tight padding (badges, icons) |
| `p-2` | 8px | Small padding (table cells, items) |
| `p-3` | 12px | Task card padding |
| `p-4` | 16px | Standard padding |
| `p-6` | 24px | Card content/header padding |
| `gap-1` | 4px | Tight icon/label gap |
| `gap-1.5` | 6px | Badge internals |
| `gap-2` | 8px | Button icon gap, standard small gap |
| `gap-3` | 12px | List item columns |
| `gap-4` | 16px | Section gap |
| `gap-6` | 24px | Card internal sections |

---

## Border Radius

Base: `--radius: 0.625rem` (10px)

| Token | Value | Tailwind | Usage |
|-------|-------|----------|-------|
| `--radius-sm` | `calc(var(--radius) - 4px)` = 6px | `rounded-sm` | Checkboxes `rounded-[4px]` |
| `--radius-md` | `calc(var(--radius) - 2px)` = 8px | `rounded-md` | Buttons, inputs, badges, dropdowns |
| `--radius-lg` | `var(--radius)` = 10px | `rounded-lg` | Dialogs, task cards |
| `--radius-xl` | `calc(var(--radius) + 4px)` = 14px | `rounded-xl` | Cards |
| `rounded-full` | 9999px | — | Avatars, switches, sliders thumb |

---

## Shadows & Elevation

| Class | Usage |
|-------|-------|
| `shadow-xs` | Buttons (outline), inputs, checkboxes |
| `shadow-sm` | Cards (default), tooltips |
| `shadow-md` | Dropdown menus |
| `shadow-lg` | Dialogs, sheets, popovers |

---

## Animations & Transitions

Powered by `tw-animate-css` and Tailwind's built-in animation classes.

### Enter/Exit Animations (Radix UI state-based)

```
data-[state=open]:animate-in
data-[state=closed]:animate-out
data-[state=closed]:fade-out-0
data-[state=open]:fade-in-0
data-[state=closed]:zoom-out-95
data-[state=open]:zoom-in-95
data-[side=bottom]:slide-in-from-top-2
data-[side=left]:slide-in-from-right-2
data-[side=right]:slide-in-from-left-2
data-[side=top]:slide-in-from-bottom-2
```

### Per-Component Transitions

| Component | Transition |
|-----------|-----------|
| Buttons | `transition-all` |
| Inputs | `transition-[color,box-shadow]` |
| Checkboxes | `transition-shadow` |
| Accordion chevron | `transition-transform duration-200` |
| Cards (hover) | `transition-all hover:shadow-md` |
| Dialogs/Sheets | `duration-200` to `duration-500` |
| Tooltips | `transition-opacity` |
| Sliders thumb | `transition-[color,box-shadow]` |

### Accordion Animations
```css
@keyframes accordion-down { from { height: 0 } to { height: var(--radix-accordion-content-height) } }
@keyframes accordion-up   { from { height: var(--radix-accordion-content-height) } to { height: 0 } }
```

### Loading States
- Skeleton: `animate-pulse bg-muted rounded-md`
- Spinner: `animate-spin`

---

## Breakpoints & Responsive Design

Using Tailwind's default breakpoints:

| Prefix | Min Width | Usage |
|--------|-----------|-------|
| (none) | 0px | Mobile first |
| `sm:` | 640px | Larger mobile/tablet |
| `md:` | 768px | Tablet |
| `lg:` | 1024px | Desktop |
| `xl:` | 1280px | Large desktop |
| `2xl:` | 1536px | Extra large |

**Container queries** are used for adaptive card headers: `@container/card-header`

---

## Dark/Light Mode

- Default mode: **dark** (`<html className="dark">`)
- Managed by `next-themes` (`ThemeProvider`)
- CSS switches via `:root` (light) and `.dark` class (dark)

```tsx
// ThemeProvider setup in layout.tsx
<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
  {children}
</ThemeProvider>
```

Dark mode overrides per component example:
```tsx
className="bg-transparent dark:bg-input/30"
className="hover:bg-accent dark:hover:bg-input/50"
className="bg-destructive dark:bg-destructive/60"
```

---

## Component Patterns

### Button

**Variants:** `default` | `destructive` | `outline` | `secondary` | `ghost` | `link`  
**Sizes:** `default` (h-9) | `sm` (h-8) | `lg` (h-10) | `icon` (size-9) | `icon-sm` (size-8) | `icon-lg` (size-10)

Base classes always present:
```
inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium
transition-all focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
disabled:pointer-events-none disabled:opacity-50
[&_svg:not([class*='size-'])]:size-4 shrink-0
```

| Variant | Classes |
|---------|---------|
| `default` | `bg-primary text-primary-foreground shadow-xs hover:bg-primary/90` |
| `destructive` | `bg-destructive text-white shadow-xs hover:bg-destructive/90 dark:bg-destructive/60` |
| `outline` | `border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input` |
| `secondary` | `bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80` |
| `ghost` | `hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50` |
| `link` | `text-primary underline-offset-4 hover:underline` |

---

### Card

```tsx
<Card>         // bg-card text-card-foreground flex flex-col gap-6 rounded-xl border py-6 shadow-sm
  <CardHeader> // @container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-2 px-6
    <CardTitle>       // leading-none font-semibold
    <CardDescription> // text-muted-foreground text-sm
    <CardAction>      // col-start-2 row-span-2 row-start-1 self-start justify-self-end
  </CardHeader>
  <CardContent> // px-6
  <CardFooter>  // flex items-center px-6 [.border-t]:pt-6
</Card>
```

---

### Input

```
h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs
transition-[color,box-shadow] outline-none
placeholder:text-muted-foreground
focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
disabled:cursor-not-allowed disabled:opacity-50
aria-invalid:border-destructive aria-invalid:ring-destructive/20
dark:bg-input/30 dark:aria-invalid:ring-destructive/40
```

---

### Badge

```
inline-flex items-center justify-center rounded-md border px-2 py-0.5
text-xs font-medium w-fit whitespace-nowrap shrink-0
focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
[&_svg:not([class*='size-'])]:size-3
```

| Variant | Classes |
|---------|---------|
| `default` | `border-transparent bg-primary text-primary-foreground hover:bg-primary/90` |
| `secondary` | `border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80` |
| `destructive` | `border-transparent bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive/60` |
| `outline` | `text-foreground` |

---

### Dialog

Overlay: `fixed inset-0 z-50 bg-black/50` + fade animation

Content:
```
fixed top-[50%] left-[50%] z-50 grid w-full max-w-[calc(100%-2rem)]
translate-x-[-50%] translate-y-[-50%] gap-4 rounded-lg border p-6 shadow-lg
duration-200 sm:max-w-lg
bg-background
```

Structure:
```tsx
<Dialog>
  <DialogContent>
    <DialogHeader>
      <DialogTitle />
      <DialogDescription />
    </DialogHeader>
    {/* content */}
    <DialogFooter>  // flex justify-end gap-2
  </DialogContent>
</Dialog>
```

---

### Dropdown Menu

Content:
```
z-50 min-w-[8rem] overflow-hidden rounded-md border p-1 shadow-md
bg-popover text-popover-foreground
+ enter/exit animations (fade + zoom + slide-from-side)
```

Item: `relative flex cursor-default items-center gap-2 rounded-sm px-2 py-1.5 text-sm`  
Separator: `bg-border -mx-1 my-1 h-px`  
Shortcut: `text-muted-foreground ml-auto text-xs tracking-widest`

---

### Table

```tsx
<Table>         // w-full caption-bottom text-sm
  <TableHeader> // [&_tr]:border-b
    <TableRow>
      <TableHead> // h-10 px-2 text-left font-medium text-foreground whitespace-nowrap
  <TableBody>
    <TableRow>  // hover:bg-muted/50 border-b transition-colors data-[state=selected]:bg-muted
      <TableCell> // p-2 align-middle whitespace-nowrap
```

---

### Tabs

List: `bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-lg p-[3px]`

Trigger:
```
inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5
rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap
transition-[color,box-shadow]
data-[state=active]:bg-background data-[state=active]:shadow-sm
```

---

### Sidebar

```tsx
<SidebarProvider>        // CSS var --sidebar-width: 16rem, --sidebar-width-icon: 3rem
  <Sidebar>              // fixed, bg-sidebar, border-r border-sidebar-border
    <SidebarHeader>      // border-b, logo + brand
    <SidebarContent>     // overflow-y-auto, flex-1
      <SidebarGroup>     // collapsible sections
        <SidebarGroupLabel>  // text-xs font-medium text-muted-foreground
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>  // flex items-center gap-2 px-2 py-1.5 rounded-md
    <SidebarFooter>      // border-t, user profile + tools
```

Sidebar collapsible (icon mode): items shrink to `--sidebar-width-icon: 3rem` showing only icons.

---

### Task Card

Board view:
```tsx
<div className="cursor-pointer rounded-lg border bg-card p-3 shadow-sm transition-all hover:shadow-md">
  {/* Tags row */}
  <div className="flex flex-wrap gap-1 mb-2">
    <Badge variant="outline" className="text-xs" />
  </div>
  {/* Title */}
  <p className="text-sm font-medium mb-2 line-clamp-2" />
  {/* Meta row */}
  <div className="flex items-center gap-2 text-xs text-muted-foreground">
    {/* Priority icon, due date */}
  </div>
  {/* Footer: subtasks, assignees */}
  <div className="flex items-center justify-between mt-2">
    <Progress className="h-1 flex-1" />
    <div className="flex -space-x-1">  {/* stacked avatars */}
      <Avatar className="size-5 ring-1 ring-background" />
    </div>
  </div>
</div>
```

Selected state: `ring-2 ring-primary`

---

### Avatar

```
relative flex shrink-0 overflow-hidden rounded-full
```

Stacking pattern: `flex -space-x-1`, each avatar has `ring-1 ring-background`

Standard sizes: `size-5` (small), `size-8` (default), `size-10` (large)

---

### Checkbox

```
peer size-4 shrink-0 rounded-[4px] border shadow-xs
transition-shadow focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50
data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=checked]:border-primary
disabled:cursor-not-allowed disabled:opacity-50
```

---

### Switch

Container: `inline-flex h-[1.15rem] w-8 items-center rounded-full border-2 border-transparent`  
Track checked: `bg-primary` / unchecked: `bg-input`  
Thumb: `size-4 rounded-full bg-background shadow-sm transition-transform`

---

### Progress Bar

```tsx
<div className="bg-primary/20 h-2 w-full overflow-hidden rounded-full">
  <div className="bg-primary h-full transition-all" style={{ width: `${value}%` }} />
</div>
```

---

### Accordion

Item: `border-b last:border-b-0`  
Trigger: `flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium`  
Chevron: `lucide ChevronDown`, `transition-transform duration-200 group-data-[state=open]:rotate-180`  
Content: `animate-accordion-down` / `animate-accordion-up`

---

### Tooltip

Content:
```
bg-foreground text-background z-50 w-fit rounded-md px-3 py-1.5 text-xs text-balance
+ fade + zoom animations
```

Arrow: `size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px] bg-foreground`

---

### Sheet (Side Panel)

Overlay: same as Dialog overlay  
Content sides:
- Right: `inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm`
- Left: `inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm`
- Top: `inset-x-0 top-0 border-b`
- Bottom: `inset-x-0 bottom-0 border-t`

---

### Select

Trigger: `h-9 w-full rounded-md border px-3 py-2 text-sm shadow-xs` (same as Input)  
Content: `z-50 min-w-[8rem] overflow-hidden rounded-md border shadow-md` + animations  
Item: `relative flex w-full cursor-default items-center rounded-sm py-1.5 pl-8 pr-2 text-sm`

---

### Skeleton

```tsx
<div className="bg-muted animate-pulse rounded-md" />
```

---

## Focus Ring Standard

All interactive elements share this focus pattern:
```
focus-visible:outline-none
focus-visible:ring-[3px]
focus-visible:ring-ring/50
```

No default browser outline — always replaced with ring.

---

## Hover/Active States

| Pattern | Usage |
|---------|-------|
| `hover:bg-accent hover:text-accent-foreground` | Navigation items, ghost buttons |
| `hover:bg-muted/50` | Table rows |
| `hover:bg-primary/90` | Primary buttons |
| `hover:shadow-md` | Task cards |
| `hover:opacity-100` | Close buttons (base: `opacity-70`) |
| `active:scale-95` | Icon buttons |

---

## Icon Usage

Library: **lucide-react**

Default size: `size-4` (16px) — applied automatically via:
```
[&_svg:not([class*='size-'])]:size-4
```

Sidebar icons: `size-4`  
Small indicators: `size-3`  
Larger icons: `size-5`, `size-6`

Icons should match text color or use `text-muted-foreground` for decorative usage.

---

## Layout Architecture

### Application Shell

```
<html class="dark">
  <body class="font-sans antialiased">
    <ThemeProvider>
      <SidebarProvider>
        <div class="flex h-screen w-full overflow-hidden">
          <AppSidebar />           ← 16rem wide, fixed/sticky
          <main class="flex-1 overflow-auto">
            {/* page content */}
          </main>
        </div>
      </SidebarProvider>
    </ThemeProvider>
  </body>
</html>
```

### Page Layout

```tsx
<div className="flex flex-col h-full">
  {/* Page header */}
  <div className="flex items-center justify-between px-6 py-4 border-b">
    <h1 className="text-xl font-semibold" />
    <div className="flex items-center gap-2">{/* actions */}</div>
  </div>
  {/* Page content */}
  <div className="flex-1 overflow-auto p-6">
    {/* content */}
  </div>
</div>
```

### Two-Column Layouts

```tsx
<div className="grid grid-cols-[280px_1fr] h-full">
  <aside className="border-r overflow-y-auto" />
  <main className="overflow-y-auto" />
</div>
```

### List Items (with actions on hover)

```tsx
<div className="group flex items-center gap-3 px-3 py-2 rounded-md hover:bg-accent">
  <Checkbox className="size-4" />
  <div className="flex-1 min-w-0">
    <p className="text-sm font-medium truncate" />
    <p className="text-xs text-muted-foreground truncate" />
  </div>
  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1">
    {/* action buttons */}
  </div>
</div>
```

---

## Patterns & Conventions

### Empty States

```tsx
<div className="flex flex-col items-center justify-center py-12 text-center">
  <IconName className="size-12 text-muted-foreground/50 mb-4" />
  <p className="text-sm font-medium text-muted-foreground">No items found</p>
  <p className="text-xs text-muted-foreground mt-1">Create one to get started</p>
</div>
```

### Section Dividers

```tsx
<Separator />   // bg-border h-px w-full   or   w-px h-full (vertical)
```

### Loading States

```tsx
{/* Inline spinner */}
<Loader2 className="size-4 animate-spin text-muted-foreground" />

{/* Skeleton blocks */}
<Skeleton className="h-4 w-48" />
<Skeleton className="h-9 w-full" />
```

### Error/Validation

```tsx
<p className="text-destructive text-sm mt-1">{errorMessage}</p>
{/* Input gets aria-invalid="true" to trigger red ring */}
<Input aria-invalid="true" />
```

### Priority Indicators

Use icon + color combination:
```tsx
// High priority
<AlertCircle className="size-3 text-destructive" />
// Medium priority  
<AlertCircle className="size-3 text-yellow-500" />
// Low priority
<AlertCircle className="size-3 text-muted-foreground" />
```

### Stacked Avatars

```tsx
<div className="flex -space-x-1.5">
  {users.map(user => (
    <Avatar key={user.id} className="size-6 ring-1 ring-background">
      <AvatarImage src={user.avatar} />
      <AvatarFallback className="text-xs">{user.initials}</AvatarFallback>
    </Avatar>
  ))}
</div>
```

---

## Do's and Don'ts

### DO
- Use semantic CSS variables (`bg-primary`, `text-muted-foreground`) over raw colors
- Always add `transition-all` or specific transitions to interactive elements
- Use `focus-visible:ring-[3px] focus-visible:ring-ring/50` on all custom interactive components
- Use `min-w-0` on flex children that contain truncated text
- Use `cn()` for conditional/merged class names
- Use `lucide-react` icons exclusively
- Use `Geist` for all text (it's loaded via the layout)
- Apply dark mode variants explicitly when a component deviates from the CSS variable behavior

### DON'T
- Don't use hardcoded hex/rgb/hsl colors in className — always use CSS variable tokens
- Don't use `outline` for focus styles — use `ring` instead
- Don't use Tailwind v3 syntax (e.g., `dark:` prefix in arbitrary values for v4)
- Don't add custom CSS when a Tailwind utility exists
- Don't use `overflow-hidden` on the main scroll container — use it on inner containers
- Don't skip `aria-*` attributes on interactive components
