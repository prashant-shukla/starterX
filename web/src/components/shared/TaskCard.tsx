import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './card'
import { Badge } from './badge'
import { Button } from './button'
import { Textarea } from './textarea'
import { Clock, CheckCircle, AlertCircle, Upload, Calendar } from 'lucide-react'

interface TaskCardProps {
  task: any
  onUpdateTask: (taskId: string, status: string, response?: string) => void
  onFileUpload: (file: File, taskId: string) => void
}

export function TaskCard({ task, onUpdateTask, onFileUpload }: TaskCardProps) {
  const [selectedTaskId, setSelectedTaskId] = useState('')
  const [responseText, setResponseText] = useState('')

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'open':
        return <Clock className="w-4 h-4 text-yellow-600" />
      default:
        return <AlertCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      'open': 'destructive',
      'completed': 'default',
      'pending': 'secondary'
    }
    return <Badge variant={variants[status] || 'secondary'}>{status}</Badge>
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      'high': 'bg-red-100 text-red-800',
      'medium': 'bg-yellow-100 text-yellow-800',
      'low': 'bg-green-100 text-green-800'
    }
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${colors[priority] || colors.medium}`}>
        {priority}
      </span>
    )
  }

  const handleSubmitResponse = () => {
    onUpdateTask(task.id, 'completed', responseText)
    setSelectedTaskId('')
    setResponseText('')
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileUpload(file, task.id)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            {getStatusIcon(task.status)}
            <div>
              <CardTitle className="text-lg">{task.title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">{task.description}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {getPriorityBadge(task.priority)}
            {getStatusBadge(task.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
          <div className="flex items-center space-x-1">
            <Calendar className="w-4 h-4" />
            <span>Due: {new Date(task.dueDate).toLocaleDateString()}</span>
          </div>
          <div>Created: {new Date(task.createdAt).toLocaleDateString()}</div>
        </div>

        {task.status === 'open' && (
          <div className="space-y-3 border-t pt-4">
            {selectedTaskId === task.id ? (
              <div className="space-y-3">
                <Textarea
                  placeholder="Type your response here..."
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  rows={3}
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSubmitResponse}
                    disabled={!responseText.trim()}
                  >
                    Submit Response
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => {
                      setSelectedTaskId('')
                      setResponseText('')
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex space-x-2">
                <Button onClick={() => setSelectedTaskId(task.id)}>
                  Respond
                </Button>
                {task.type === 'document' && (
                  <Button variant="outline" onClick={() => document.getElementById(`file-upload-${task.id}`)?.click()}>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload File
                  </Button>
                )}
                <input
                  id={`file-upload-${task.id}`}
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
