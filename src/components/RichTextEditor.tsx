import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
  const handleImageClick = React.useCallback((event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target.tagName === 'IMG') {
      const sizes = ['small', 'medium', 'large'];
      const currentSize = target.classList.contains('small') ? 'small' :
                         target.classList.contains('medium') ? 'medium' : 'large';
      
      const currentIndex = sizes.indexOf(currentSize);
      const nextSize = sizes[(currentIndex + 1) % sizes.length];
      
      // Supprimer toutes les classes de taille
      sizes.forEach(size => target.classList.remove(size));
      // Ajouter la nouvelle taille
      target.classList.add(nextSize);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        HTMLAttributes: {
          class: 'resize-image',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  React.useEffect(() => {
    if (editor) {
      const element = editor.view.dom;
      element.addEventListener('click', handleImageClick);
      return () => {
        element.removeEventListener('click', handleImageClick);
      };
    }
  }, [editor, handleImageClick]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-gray-300 rounded-md overflow-hidden">
      <div className="bg-gray-50 border-b border-gray-300 p-2 flex gap-2">
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded ${
            editor.isActive('bold')
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Gras"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded ${
            editor.isActive('italic')
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Italique"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded ${
            editor.isActive('bulletList')
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Liste à puces"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded ${
            editor.isActive('orderedList')
              ? 'bg-gray-200 text-gray-900'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
          title="Liste numérotée"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            const url = window.prompt('URL de l\'image:');
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          className="p-1.5 rounded text-gray-600 hover:bg-gray-200"
          title="Insérer une image"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
      <EditorContent
        editor={editor}
        className="prose max-w-none p-4 min-h-[150px] focus:outline-none"
      />
      <style>
        {`
          .resize-image {
            max-width: 100%;
            height: auto;
            border-radius: 0.5rem;
            margin: 1rem 0;
            cursor: pointer;
            transition: all 0.2s ease-in-out;
          }
          .resize-image:hover {
            box-shadow: 0 0 0 3px rgba(202, 35, 28, 0.1);
          }
          .resize-image.selected {
            box-shadow: 0 0 0 3px rgba(202, 35, 28, 0.2);
          }
          .resize-image.small {
            width: 25%;
          }
          .resize-image.medium {
            width: 50%;
          }
          .resize-image.large {
            width: 100%;
          }
        `}
      </style>
    </div>
  );
};

export default RichTextEditor;
