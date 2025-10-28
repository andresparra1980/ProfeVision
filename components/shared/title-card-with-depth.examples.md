# TitleCardWithDepth Component - Usage Examples

A prominent card component with enhanced depth and shadow, designed for dashboard section titles and headers.

## Features

- **Enhanced depth**: Uses `shadow-lg` with hover effect to `shadow-xl`
- **Responsive layout**: Stacks on mobile, side-by-side on desktop
- **Flexible content**: Supports icons, titles, descriptions, and action buttons
- **Smooth transitions**: Hover effects with 300ms duration
- **Customizable**: Accepts custom className for all parts

## Basic Usage

### Simple Title and Description

```tsx
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';

<TitleCardWithDepth
  title="Dashboard Overview"
  description="Welcome back! Here's what's happening today."
/>
```

### With Action Buttons

```tsx
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { Button } from '@/components/ui/button';

<TitleCardWithDepth
  title="Student Results"
  description="View and manage all student exam results"
  actions={
    <div className="flex gap-2">
      <Button variant="outline">Export</Button>
      <Button>Add New</Button>
    </div>
  }
/>
```

### With Icon

```tsx
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { FileText } from 'lucide-react';

<TitleCardWithDepth
  icon={
    <div className="p-2 bg-primary/10 rounded-lg">
      <FileText className="h-6 w-6 text-primary" />
    </div>
  }
  title="Exam Management"
  description="Create, edit, and organize your exams"
/>
```

### With Dynamic Content

```tsx
import { TitleCardWithDepth } from '@/components/shared/title-card-with-depth';
import { useTranslations } from 'next-intl';

function ExamResultsPage() {
  const t = useTranslations('dashboard.exams.results');
  const examDetails = useExamDetails();

  return (
    <TitleCardWithDepth
      title={
        <>
          {t('title')}: {examDetails?.titulo || t('loading')}
        </>
      }
      description={t('description')}
      actions={<ExportButton />}
    />
  );
}
```

### Custom Styling

```tsx
<TitleCardWithDepth
  title="Custom Styled Card"
  description="This card has custom styling applied"
  className="bg-gradient-to-r from-primary/5 to-secondary/5"
  titleClassName="text-primary"
  descriptionClassName="text-lg"
/>
```

## Real-World Examples

### Exam Results Page

See: `app/[locale]/dashboard/exams/[id]/results/page.tsx`

```tsx
<TitleCardWithDepth
  title={
    <>
      {t('title')}: {examDetails?.titulo || t('loading')}
    </>
  }
  description={t('description')}
  actions={
    <ResultsPageActions
      examDetails={examDetails}
      resultados={resultados}
      totalPreguntas={totalPreguntas}
      selectedGroupId={selectedGroupId}
      onExportExcel={handleExportToExcel}
    />
  }
/>
```

## Comparison with Regular Cards

| Feature | Regular Card | TitleCardWithDepth |
|---------|-------------|-------------------|
| Shadow | `shadow-sm` | `shadow-lg` (hover: `shadow-xl`) |
| Border Radius | `rounded-lg` | `rounded-xl` |
| Purpose | General content | Section headers/titles |
| Layout | Basic flex | Responsive with actions support |
| Visual Impact | Subtle | Prominent |

## Best Practices

1. **Use for section headers**: This component is designed for important section titles, not general content cards
2. **Limit usage**: Don't overuse - reserve for main page headers or key section dividers
3. **Consistent spacing**: Use with proper spacing (e.g., `space-y-4`) between other elements
4. **Action buttons**: Keep actions relevant and concise (2-3 buttons max)
5. **Accessibility**: Ensure title text is descriptive and meaningful

## When to Use

✅ **Use when:**
- Creating a main page header
- Introducing a major dashboard section
- Need to emphasize important content
- Want to separate distinct sections visually

❌ **Don't use when:**
- Displaying list items
- Creating data cards in a grid
- Need subtle, background elements
- Building navigation components
