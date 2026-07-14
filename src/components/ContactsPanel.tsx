import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Contact } from '../context/AppContext';
import {
  UserPlus,
  Search,
  Phone,
  Mail,
  Building2,
  Trash2,
  Pencil,
  X,
  Users
} from 'lucide-react';

const EMPTY_FORM = { name: '', phone: '', email: '', company: '', role: '', notes: '' };

export const ContactsPanel: React.FC = () => {
  const { contacts, addContact, updateContact, deleteContact } = useApp();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const filtered = contacts.filter(c => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return [c.name, c.company, c.email, c.phone, c.role || '']
      .some(field => field.toLowerCase().includes(q));
  });

  const openNew = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (contact: Contact) => {
    setEditingId(contact.id);
    setForm({
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      company: contact.company,
      role: contact.role || '',
      notes: contact.notes || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    const data = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim(),
      company: form.company.trim(),
      role: form.role.trim() || undefined,
      notes: form.notes.trim() || undefined
    };

    if (editingId) {
      updateContact(editingId, data);
    } else {
      addContact(data);
    }
    setShowModal(false);
  };

  const handleDelete = (contact: Contact) => {
    if (window.confirm(`¿Eliminar a ${contact.name} de la agenda?`)) {
      deleteContact(contact.id);
    }
  };

  const setField = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className="main-content main-content--viewport flex flex-col animate-fade-in">
      {/* Header */}
      <header className="flex justify-between items-center pb-4 border-b border-border-color">
        <div>
          <h2 className="text-xl font-bold font-display text-white">Agenda de Contactos</h2>
          <p className="text-xs text-text-secondary">Fuentes, entrevistados y contactos de empresas mineras</p>
        </div>
        <button onClick={openNew} className="glass-button active text-xs">
          <UserPlus size={14} /> Nuevo Contacto
        </button>
      </header>

      {/* Buscador */}
      <div className="relative mt-4 max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nombre, empresa, mail o teléfono..."
          className="glass-input w-full pl-9"
        />
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto mt-4 pr-1">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-muted">
            <Users size={36} className="opacity-40" />
            <p className="text-sm">
              {contacts.length === 0
                ? 'Todavía no hay contactos. Cargá el primero con "Nuevo Contacto".'
                : 'Ningún contacto coincide con la búsqueda.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map(contact => (
              <div key={contact.id} className="glass-panel p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white leading-snug truncate">{contact.name}</h4>
                    {contact.role && (
                      <p className="text-[11px] text-accent-gold font-semibold">{contact.role}</p>
                    )}
                  </div>
                  <div className="flex gap-0.5 shrink-0">
                    <button
                      onClick={() => openEdit(contact)}
                      className="text-text-muted hover:text-accent-gold p-1 rounded hover:bg-white/5 transition-colors"
                      title="Editar contacto"
                    >
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact)}
                      className="text-text-muted hover:text-accent-red p-1 rounded hover:bg-white/5 transition-colors"
                      title="Eliminar contacto"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 text-xs text-text-secondary pt-2 border-t border-white/5">
                  {contact.company && (
                    <span className="flex items-center gap-2 min-w-0">
                      <Building2 size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">{contact.company}</span>
                    </span>
                  )}
                  {contact.phone && (
                    <a href={`tel:${contact.phone}`} className="flex items-center gap-2 hover:text-accent-gold transition-colors min-w-0">
                      <Phone size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">{contact.phone}</span>
                    </a>
                  )}
                  {contact.email && (
                    <a href={`mailto:${contact.email}`} className="flex items-center gap-2 hover:text-accent-gold transition-colors min-w-0">
                      <Mail size={12} className="text-text-muted shrink-0" />
                      <span className="truncate">{contact.email}</span>
                    </a>
                  )}
                  {contact.notes && (
                    <p className="text-[11px] text-text-muted italic line-clamp-2 mt-1">{contact.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL NUEVO / EDITAR */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="glass-panel w-full max-w-md p-6 bg-secondary border border-white/10 flex flex-col gap-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h3 className="text-md font-bold font-display text-white">
                {editingId ? 'Editar Contacto' : 'Nuevo Contacto'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-text-muted hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Nombre *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={setField('name')}
                  placeholder="Ej: Juan Pérez"
                  className="glass-input"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Empresa</label>
                  <input
                    type="text"
                    value={form.company}
                    onChange={setField('company')}
                    placeholder="Ej: McEwen Copper"
                    className="glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Cargo</label>
                  <input
                    type="text"
                    value={form.role}
                    onChange={setField('role')}
                    placeholder="Ej: Gerente de Prensa"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Teléfono</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={setField('phone')}
                    placeholder="Ej: +54 264 555-0000"
                    className="glass-input"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-text-secondary">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={setField('email')}
                    placeholder="Ej: jperez@empresa.com"
                    className="glass-input"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-text-secondary">Notas</label>
                <textarea
                  value={form.notes}
                  onChange={setField('notes')}
                  placeholder="Contexto: cómo lo conociste, temas que maneja, horarios..."
                  className="glass-input resize-none h-16"
                />
              </div>

              <button type="submit" className="glass-button active py-2.5 justify-center mt-2 font-semibold">
                {editingId ? 'Guardar Cambios' : 'Agregar Contacto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
