"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, type ChainedCommands } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Placeholder from '@tiptap/extension-placeholder';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Underline as UnderlineIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Define extended chain commands with focus method
interface ExtendedChainedCommands extends ChainedCommands {
  focus(): ExtendedChainedCommands;
}

/* eslint-disable */
interface RichTextEditorProps {
  _value: string; // Initial content value for the editor
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}
/* eslint-enable */

// Simplified props with rest pattern to avoid linter issues
export function RichTextEditor(props: RichTextEditorProps) {
  const { onChange, placeholder = 'Escribe aquí tu pregunta...', className } = props;
  const initialContent = props._value;

  const [isMounted, setIsMounted] = useState(false);

  // Only initialize the editor on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({
        placeholder,
        emptyEditorClass: 'is-editor-empty',
      }),
    ],
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'p-3 min-h-[150px] prose prose-sm max-w-none text-foreground focus:outline-none',
      },
    },
    immediatelyRender: false,
  });

  // Don't render the editor until client-side hydration is complete
  if (!isMounted) {
    return (
      <div className={cn("rich-text-editor w-full", className)}>
        <div className="border rounded-md mb-2 overflow-hidden">
          <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
            {/* Toolbar placeholder */}
          </div>
          <div className="bg-background">
            <div className="p-3 min-h-[150px] prose prose-sm max-w-none text-foreground border-0" />
          </div>
        </div>
      </div>
    );
  }

  if (!editor) {
    return null;
  }
  
  // Workaround for TypeScript errors with TipTap's focus() method
  const onBoldClick = () => {
    (editor.chain() as ExtendedChainedCommands).focus().toggleBold().run();
  };
  
  const onItalicClick = () => {
    (editor.chain() as ExtendedChainedCommands).focus().toggleItalic().run();
  };
  
  const onUnderlineClick = () => {
    (editor.chain() as ExtendedChainedCommands).focus().toggleUnderline().run();
  };
  
  const onBulletListClick = () => {
    (editor.chain() as ExtendedChainedCommands).focus().toggleBulletList().run();
  };
  
  const onOrderedListClick = () => {
    (editor.chain() as ExtendedChainedCommands).focus().toggleOrderedList().run();
  };

  return (
    <div className={cn("rich-text-editor w-full", className)}>
      <div className="border rounded-md mb-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onBoldClick}
            className={cn("h-8 w-8 p-0", editor.isActive('bold') ? 'bg-muted' : '')}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onItalicClick}
            className={cn("h-8 w-8 p-0", editor.isActive('italic') ? 'bg-muted' : '')}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onUnderlineClick}
            className={cn("h-8 w-8 p-0", editor.isActive('underline') ? 'bg-muted' : '')}
            title="Subrayado"
          >
            <UnderlineIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onBulletListClick}
            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') ? 'bg-muted' : '')}
            title="Lista de viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={onOrderedListClick}
            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') ? 'bg-muted' : '')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
        </div>
        <div className="bg-background">
          <EditorContent 
            editor={editor} 
            className="p-3 min-h-[150px] prose prose-sm max-w-none text-foreground" 
          />
        </div>
      </div>

      <style jsx global>{`
        /* Base editor styles */
        .ProseMirror {
          min-height: 150px;
          outline: none !important;
          color: var(--foreground);
          line-height: 1.25;
        }
        /* Focus state */
        .ProseMirror:focus {
          outline: none !important;
        }
        /* Content spacing */
        .ProseMirror p {
          margin: 0.4em 0;
        }
        /* Headings */
        .ProseMirror h1, 
        .ProseMirror h2, 
        .ProseMirror h3, 
        .ProseMirror h4, 
        .ProseMirror h5, 
        .ProseMirror h6 {
          color: var(--foreground);
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        /* Lists */
        .ProseMirror ul, 
        .ProseMirror ol, 
        .ProseMirror li {
          color: var(--foreground);
        }
        /* Links and blockquotes */
        .ProseMirror a,
        .ProseMirror blockquote {
          color: var(--foreground);
        }
        /* Placeholder text */
        .ProseMirror p.is-editor-empty:first-child::before {
          color: var(--muted-foreground);
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
          opacity: 0.6;
        }
        /* Override Tailwind prose styles */
        .prose {
          color: var(--foreground) !important;
          max-width: none;
        }
        /* Force color inheritance for all prose elements */
        .prose p,
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6,
        .prose ul,
        .prose ol,
        .prose li,
        .prose a,
        .prose blockquote,
        .prose strong,
        .prose em {
          color: var(--foreground) !important;
        }
      `}</style>
    </div>
  );
} 