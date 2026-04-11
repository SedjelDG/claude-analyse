import { useState, useCallback } from "react";

export type ContactType = "supplier" | "client";

export interface Contact {
  id: string;
  type: ContactType;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  balance: number;
}

const STORAGE_KEY = "ds-contacts";

const defaultContacts: Contact[] = [
  { id: "s1", type: "supplier", name: "Fournisseur A", phone: "0555 11 22 33", email: "a@fournisseur.dz", address: "Alger", notes: "Livraison rapide", balance: 0 },
  { id: "s2", type: "supplier", name: "Fournisseur B", phone: "0555 44 55 66", email: "b@fournisseur.dz", address: "Oran", notes: "", balance: -15000 },
  { id: "s3", type: "supplier", name: "Fournisseur C", phone: "0555 77 88 99", email: "", address: "Constantine", notes: "Fruits et légumes", balance: 0 },
  { id: "c1", type: "client", name: "Client Gros A", phone: "0666 11 22 33", email: "client.a@mail.dz", address: "Alger", notes: "Paiement mensuel", balance: 25000 },
  { id: "c2", type: "client", name: "Client Gros B", phone: "0666 44 55 66", email: "", address: "Blida", notes: "", balance: -5000 },
];

function loadContacts(): Contact[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return JSON.parse(stored);
  } catch {}
  return defaultContacts;
}

function saveContacts(contacts: Contact[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
}

export function useContacts() {
  const [contacts, setContacts] = useState<Contact[]>(loadContacts);

  const persist = useCallback((next: Contact[]) => {
    setContacts(next);
    saveContacts(next);
  }, []);

  const addContact = useCallback((contact: Omit<Contact, "id">) => {
    const newContact: Contact = { ...contact, id: `${contact.type[0]}${Date.now()}` };
    setContacts((prev) => {
      const next = [...prev, newContact];
      saveContacts(next);
      return next;
    });
    return newContact;
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, ...updates } : c));
      saveContacts(next);
      return next;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts((prev) => {
      const next = prev.filter((c) => c.id !== id);
      saveContacts(next);
      return next;
    });
  }, []);

  const addCredit = useCallback((clientId: string, amount: number) => {
    setContacts((prev) => {
      const next = prev.map((c) =>
        c.id === clientId ? { ...c, balance: c.balance + amount } : c
      );
      saveContacts(next);
      return next;
    });
  }, []);

  const clients = contacts.filter((c) => c.type === "client");
  const suppliers = contacts.filter((c) => c.type === "supplier");

  return { contacts, clients, suppliers, addContact, updateContact, removeContact, addCredit, persist };
}
