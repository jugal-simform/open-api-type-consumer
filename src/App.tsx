import { useState } from 'react'
import { useBlogs, useCreateBlog, useDeleteBlog, useUpdateBlog } from './hooks/useBlogs'
import './App.css'

type BlogFormState = { title: string; content: string; author: string }

const emptyForm: BlogFormState = { title: '', content: '', author: '' }

function App() {
  const { data: blogs, isLoading, isError } = useBlogs()
  const createBlog = useCreateBlog()
  const updateBlog = useUpdateBlog()
  const deleteBlog = useDeleteBlog()

  const [form, setForm] = useState<BlogFormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<BlogFormState>(emptyForm)

  function handleCreate(event: React.FormEvent) {
    event.preventDefault()
    createBlog.mutate(
      { body: form },
      { onSuccess: () => setForm(emptyForm) },
    )
  }

  function startEdit(blog: BlogFormState & { id: string }) {
    setEditingId(blog.id)
    setEditForm({ title: blog.title, content: blog.content, author: blog.author })
  }

  function handleUpdate(event: React.FormEvent, id: string) {
    event.preventDefault()
    updateBlog.mutate(
      { params: { path: { id } }, body: editForm },
      { onSuccess: () => setEditingId(null) },
    )
  }

  function handleDelete(id: string) {
    deleteBlog.mutate({ params: { path: { id } } })
  }

  return (
    <section id="center">
      <div>
        <h1>Blogs</h1>
        <p>
          Fetched with <code>openapi-fetch</code> + <code>openapi-react-query</code>,
          typed from the backend's OpenAPI schema.
        </p>
      </div>

      <form className="blog-form" onSubmit={handleCreate}>
        <h2>New blog</h2>
        <input
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
        />
        <input
          placeholder="Author"
          value={form.author}
          onChange={(e) => setForm({ ...form, author: e.target.value })}
          required
        />
        <textarea
          placeholder="Content"
          value={form.content}
          onChange={(e) => setForm({ ...form, content: e.target.value })}
          required
        />
        <button type="submit" disabled={createBlog.isPending}>
          {createBlog.isPending ? 'Creating…' : 'Create blog'}
        </button>
      </form>

      {isLoading && <p>Loading blogs…</p>}
      {isError && <p>Failed to load blogs.</p>}

      {blogs && (
        <ul className="blog-list">
          {blogs.map((blog) => (
            <li key={blog.id} className="blog-card">
              {editingId === blog.id ? (
                <form onSubmit={(e) => handleUpdate(e, blog.id)}>
                  <input
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    required
                  />
                  <input
                    value={editForm.author}
                    onChange={(e) => setEditForm({ ...editForm, author: e.target.value })}
                    required
                  />
                  <textarea
                    value={editForm.content}
                    onChange={(e) => setEditForm({ ...editForm, content: e.target.value })}
                    required
                  />
                  <div className="blog-actions">
                    <button type="submit" disabled={updateBlog.isPending}>
                      {updateBlog.isPending ? 'Saving…' : 'Save'}
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <h2>{blog.title}</h2>
                  <p className="blog-meta">
                    by {blog.author} on {new Date(blog.createdAt).toLocaleDateString()}
                  </p>
                  <p>{blog.content}</p>
                  <div className="blog-actions">
                    <button type="button" onClick={() => startEdit(blog)}>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(blog.id)}
                      disabled={deleteBlog.isPending}
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default App
