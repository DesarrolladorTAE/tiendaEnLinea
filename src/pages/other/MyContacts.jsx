import React, { Fragment, useState } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from '../../components/withAuth';
// import './Contact.scss';

const Contact = () => {
    const { pathname } = useLocation();
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [error, setError] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (phone.length !== 10) {
            setError("Son 10 dígitos");
            return;
        }
        setError("");
        if (editingIndex !== null) {
            const updatedContacts = contacts.map((contact, index) =>
                index === editingIndex ? { name, phone } : contact
            );
            setContacts(updatedContacts);
            setEditingIndex(null);
        } else {
            setContacts([...contacts, { name, phone }]);
        }
        setName("");
        setPhone("");
    };

    const handleEdit = (index) => {
        setName(contacts[index].name);
        setPhone(contacts[index].phone);
        setEditingIndex(index);
    };

    const handleDelete = (index) => {
        const updatedContacts = contacts.filter((_, i) => i !== index);
        setContacts(updatedContacts);
    };

    return (
        <Fragment>
            <SEO
                titleTemplate="Nuevo Contacto"
                description="Página para agregar y gestionar contactos."
            />
            <LayoutOne headerTop="visible">
                <Breadcrumb 
                    pages={[
                        { label: "Inicio", path: '/' },
                        { label: "Mis Contactos", path: pathname }
                    ]}
                />
                <div className="contact-page">
                    <div className="form-container">
                        <h2 className="contact-title">Nuevo Contacto</h2>
                        <div className="avatar-container">
                            <div className="avatar"></div>
                            <div className="icon-container">
                                <button className="icon-button">Editar</button>
                                <button className="icon-button">Eliminar</button>
                            </div>
                        </div>
                        <form onSubmit={handleSubmit} className="contact-form">
                            <input
                                type="text"
                                placeholder="Nombre del contacto"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                            <input
                                type="tel"
                                placeholder="Número telefónico"
                                value={phone}
                                onChange={(e) => {
                                    if (e.target.value.length <= 10) {
                                        setPhone(e.target.value);
                                        setError("");
                                    } else {
                                        setError("Son 10 dígitos");
                                    }
                                }}
                                required
                            />
                            {error && <p className="error-message">{error}</p>}
                            <div className="button-container">
                                <button type="submit">Agregar</button>
                            </div>
                        </form>
                    </div>
                    <div className="contact-list-container">
                        <div className="contact-list-wrapper">
                            <ul className="contact-list">
                                {contacts.map((contact, index) => (
                                    <li key={index} className="contact-item">
                                        <div className="contact-avatar"></div>
                                        <div className="contact-info">
                                            <span className="contact-name">{contact.name}</span>
                                            <span className="phone-icon">📞 {contact.phone}</span>
                                        </div>
                                        <div className="icon-container">
                                            <button className="icon-button" onClick={() => handleEdit(index)}>✏️</button>
                                            <button className="icon-button" onClick={() => handleDelete(index)}>🗑️</button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </LayoutOne>
        </Fragment>
    );
};

export default withAuth(Contact);