"use client";

import { useState } from "react";
import { Globe, Instagram, Facebook, Phone, Save, RefreshCw, Pencil, X, ExternalLink } from "lucide-react";

interface ContactDataSectionProps {
  website: string;
  instagram: string;
  facebook: string;
  phone: string;
  onSave: (data: { website: string; instagram: string; facebook: string; phone: string }) => Promise<void>;
}

export function ContactDataSection({
  website,
  instagram,
  facebook,
  phone,
  onSave,
}: ContactDataSectionProps) {
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({ website, instagram, facebook, phone });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(editData);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({ website, instagram, facebook, phone });
    setEditing(false);
  };

  const updateField = (field: string, value: string) => {
    setEditData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Datos de Contacto</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-medium hover:bg-green-600 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                Guardar
              </button>
              <button
                onClick={handleCancel}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300"
              >
                <X size={12} /> Cancelar
              </button>
            </>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200"
            >
              <Pencil size={12} /> Editar
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContactField
          icon={<Globe size={14} />}
          label="Sitio Web"
          editing={editing}
          value={editData.website}
          onChange={(v) => updateField("website", v)}
          display={
            website ? (
              <a href={website} target="_blank" rel="noopener noreferrer" className="text-ueno-blue hover:underline flex items-center gap-1">
                {website} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-gray-300">No configurado</span>
            )
          }
          inputType="url"
          placeholder="https://ejemplo.com"
        />
        <ContactField
          icon={<Instagram size={14} />}
          label="Instagram"
          editing={editing}
          value={editData.instagram}
          onChange={(v) => updateField("instagram", v)}
          display={
            instagram ? (
              <a href={`https://instagram.com/${instagram}`} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:underline flex items-center gap-1">
                @{instagram} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-gray-300">No configurado</span>
            )
          }
          placeholder="@usuario"
        />
        <ContactField
          icon={<Facebook size={14} />}
          label="Facebook"
          editing={editing}
          value={editData.facebook}
          onChange={(v) => updateField("facebook", v)}
          display={
            facebook ? (
              <a href={`https://facebook.com/${facebook}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                {facebook} <ExternalLink size={12} />
              </a>
            ) : (
              <span className="text-gray-300">No configurado</span>
            )
          }
          placeholder="pagina o URL"
        />
        <ContactField
          icon={<Phone size={14} />}
          label="Teléfono"
          editing={editing}
          value={editData.phone}
          onChange={(v) => updateField("phone", v)}
          display={phone || <span className="text-gray-300">No configurado</span>}
          inputType="tel"
          placeholder="(021) 123 456"
        />
      </div>
    </div>
  );
}

function ContactField({
  icon,
  label,
  editing,
  value,
  onChange,
  display,
  inputType = "text",
  placeholder,
}: {
  icon: React.ReactNode;
  label: string;
  editing: boolean;
  value: string;
  onChange: (v: string) => void;
  display: React.ReactNode;
  inputType?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {icon} {label}
      </label>
      {editing ? (
        <input
          type={inputType}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        />
      ) : (
        <div className="text-sm text-gray-600">{display}</div>
      )}
    </div>
  );
}
