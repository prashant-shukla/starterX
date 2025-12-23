import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { Button } from './button';
import { toast as de } from 'sonner';
import { apiRequest } from '../../utils/api';

interface Note {
  id: string;
  // company_id: string; // Removed company_id from the Note interface
  user_id: string;
  content: string;
  user_name: string;
  user_email: string;
  user_role: string;
  created_at: string;
  updated_at: string;
}

interface NotesTabProps {
  userId: string;
  authToken?: string;
}

const NotesTab: React.FC<NotesTabProps> = ({ userId, authToken }) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch notes
  const fetchNotes = async () => {
    try {
      setLoading(true);
      const data = await apiRequest(`/notes/user/${userId}`, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      setNotes(Array.isArray(data?.data) ? data.data : []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Failed to load notes');
      console.error('Error fetching notes:', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load and polling
  useEffect(() => {
    fetchNotes();
    const interval = setInterval(() => {
      fetchNotes();
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [userId, authToken]);

  // Post new note
  const handleSaveNote = async () => {
    if (!newNoteContent.trim()) {
      de.error('Note cannot be empty');
      return;
    }

    try {
      setIsSaving(true);
      const result = await apiRequest(`/notes/user/${userId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { 'Authorization': `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          content: newNoteContent,
        }),
      });

      setNotes((prev) => [result.data, ...prev]);
      setNewNoteContent('');
      setIsModalOpen(false);
      de.success('Note added successfully');
    } catch (err: any) {
      console.error('Error posting note:', err);
      de.error(err?.message || 'Failed to post note');
    } finally {
      setIsSaving(false);
    }
  };

  const formatTime = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return timestamp;
    }
  };

  const handleCancel = () => {
    setNewNoteContent('');
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200">
      {/* Header with Add Note Button */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Note
        </Button>
      </div>

      {/* Notes Container */}
      <div className="flex-1 overflow-y-auto p-6">
        {error && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center text-red-600">
              <p className="font-medium">Error loading notes</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        {loading && notes.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-gray-500">
            <div className="text-center">
              <p className="text-base text-gray-600">No notes found for this company. Use the button above to create a new note.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map((note) => (
              <div
                key={note.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <p className="text-gray-700 text-sm mb-3">{note.content}</p>
                <p className="text-xs text-gray-500">
                  Created by {note.user_name} • {formatTime(note.created_at)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full mx-4">
            {/* Modal Header */}
            <div className="border-b border-gray-200 px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">Add New Note</h2>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <textarea
                placeholder="Type your note here..."
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={6}
              />
            </div>

            {/* Modal Footer */}
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <Button
                onClick={handleCancel}
                variant="outline"
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSaveNote}
                disabled={isSaving || !newNoteContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesTab;
