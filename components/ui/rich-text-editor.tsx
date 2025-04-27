"use client";

import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import { Button } from '@/components/ui/button';
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading2,
  Image as ImageIcon,
  Link as LinkIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

  const [imageUrl, setImageUrl] = useState('');
  const [showImageInput, setShowImageInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Only initialize the editor on the client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
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
    // Fix for SSR hydration issues
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

  const addImage = () => {
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  const addLink = () => {
    if (linkUrl) {
      editor.chain().focus().setLink({ href: linkUrl }).run();
      setLinkUrl('');
      setShowLinkInput(false);
    }
  };

  return (
    <div className={cn("rich-text-editor w-full", className)}>
      <div className="border rounded-md mb-2 overflow-hidden">
        <div className="flex flex-wrap items-center gap-1 p-2 border-b bg-muted/20">
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bold') ? 'bg-muted' : '')}
            title="Negrita"
          >
            <Bold className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('italic') ? 'bg-muted' : '')}
            title="Cursiva"
          >
            <Italic className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={cn("h-8 w-8 p-0", editor.isActive('heading', { level: 2 }) ? 'bg-muted' : '')}
            title="Encabezado"
          >
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('bulletList') ? 'bg-muted' : '')}
            title="Lista de viñetas"
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn("h-8 w-8 p-0", editor.isActive('orderedList') ? 'bg-muted' : '')}
            title="Lista numerada"
          >
            <ListOrdered className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-muted-foreground/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => setShowImageInput(!showImageInput)}
            className="h-8 w-8 p-0"
            title="Agregar imagen"
          >
            <ImageIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => {
              if (editor.isActive('link')) {
                editor.chain().focus().unsetLink().run();
              } else {
                setShowLinkInput(!showLinkInput);
              }
            }}
            className={cn("h-8 w-8 p-0", editor.isActive('link') ? 'bg-muted' : '')}
            title={editor.isActive('link') ? 'Quitar enlace' : 'Agregar enlace'}
          >
            <LinkIcon className="h-4 w-4" />
          </Button>
          <div className="h-6 w-px bg-muted-foreground/20 mx-1" />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'left' }) ? 'bg-muted' : '')}
            title="Alinear a la izquierda"
          >
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'center' }) ? 'bg-muted' : '')}
            title="Alinear al centro"
          >
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={cn("h-8 w-8 p-0", editor.isActive({ textAlign: 'right' }) ? 'bg-muted' : '')}
            title="Alinear a la derecha"
          >
            <AlignRight className="h-4 w-4" />
          </Button>
        </div>

        {showImageInput && (
          <div className="flex items-center gap-2 p-2 border-b">
            <input
              type="text"
              placeholder="Pega la URL de la imagen..."
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="button" size="sm" onClick={addImage}>
              Insertar
            </Button>
          </div>
        )}

        {showLinkInput && (
          <div className="flex items-center gap-2 p-2 border-b">
            <input
              type="text"
              placeholder="Pega la URL del enlace..."
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            <Button type="button" size="sm" onClick={addLink}>
              Insertar
            </Button>
          </div>
        )}

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

      {editor && (
        <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }}>
          <div className="flex items-center rounded-md border bg-background shadow-md">
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0", editor.isActive('bold') ? 'bg-muted' : '')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 p-0", editor.isActive('italic') ? 'bg-muted' : '')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 p-0"
              onClick={() => {
                if (editor.isActive('link')) {
                  editor.chain().focus().unsetLink().run();
                } else {
                  const url = window.prompt('URL');
                  if (url) editor.chain().focus().setLink({ href: url }).run();
                }
              }}
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
        </BubbleMenu>
      )}
    </div>
  );
} 