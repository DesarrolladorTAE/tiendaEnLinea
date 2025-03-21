import React, { Fragment, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import SEO from "../../components/seo";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from '../../components/withAuth';
import axios from '../../axiosConfig'; // Importa axios con la configuración personalizada

const Contact = () => {
    const { pathname } = useLocation();
    const [contacts, setContacts] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [error, setError] = useState("");  // Error de longitud
    const [phoneError, setPhoneError] = useState("");  // Error de caracteres no numéricos

    useEffect(() => {
        // Obtener los contactos cuando el componente se monta
        axios.get('/contacts')
            .then(response => {
                setContacts(response.data);
            })
            .catch(error => {
                console.error("Hubo un error al obtener los contactos", error);
            });
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Verifica si el teléfono tiene exactamente 10 dígitos
        if (phone.length !== 10) {
            setError("Son 10 dígitos");
            return;
        }
        setError("");  // Limpia el error si es válido

        // Si estamos editando un contacto, actualizamos
        if (editingIndex !== null) {
            const updatedContact = { name, phone };
            axios.put(`/contacts/${contacts[editingIndex].id}`, updatedContact)
                .then(response => {
                    const updatedContacts = contacts.map((contact, index) =>
                        index === editingIndex ? response.data : contact
                    );
                    setContacts(updatedContacts);
                    setEditingIndex(null);
                })
                .catch(error => {
                    console.error("Error al actualizar el contacto", error);
                });
        } else {
            // Si no estamos editando, creamos un nuevo contacto
            const newContact = { name, phone };
            axios.post('/contacts', newContact)
                .then(response => {
                    setContacts([...contacts, response.data]);
                })
                .catch(error => {
                    console.error("Error al agregar el contacto", error);
                });
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
        axios.delete(`/contacts/${contacts[index].id}`)
            .then(() => {
                const updatedContacts = contacts.filter((_, i) => i !== index);
                setContacts(updatedContacts);
            })
            .catch(error => {
                console.error("Error al eliminar el contacto", error);
            });
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value;

        // Solo permitir valores numéricos
        if (/^[0-9]*$/.test(value)) {
            setPhone(value);
            setPhoneError("");  // Limpiar error si es un número válido
            
            // Verificar si el número tiene exactamente 10 dígitos
            if (value.length > 10) {
                setPhone(value.slice(0, 10));  // Limitar a 10 dígitos
                setError("Son 10 dígitos");
            } else {
                setError("");  // Limpiar el error si tiene 10 dígitos o menos
            }
        } else {
            setPhoneError("Solo números telefónicos");  // Error si no es numérico
            setError("");  // Limpiar el error de los dígitos
        }
    };

    return (
        <Fragment>
            <SEO titleTemplate="Mis Contactos" description="Página para agregar y gestionar contactos." />
            <LayoutOne headerTop="visible">
                <Breadcrumb pages={[{ label: "Inicio", path: '/' }, { label: "Mis Contactos", path: pathname }]} />
                <div className="contact-page">
                    <div className="form-container">
                        <h2 className="contact-title">Nuevo Contacto</h2>
                        <div className="avatar-container">
                            <div className="avatar"></div>
                            <div className="icon-container">
                                <button className="icon-button" onClick={() => handleEdit(editingIndex)}>Editar</button>
                                <button className="icon-button" onClick={() => handleDelete(editingIndex)}>Eliminar</button>
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
                                onChange={handlePhoneChange}  // Usamos el nuevo manejador
                                required
                            />
                            {phoneError && <p className="error-message">{phoneError}</p>}  {/* Mostrar el error de solo números */}
                            {error && <p className="error-message">{error}</p>}  {/* Mostrar el error de dígitos */}
                            <div className="button-container">
                                <button type="submit">{editingIndex !== null ? "Actualizar" : "Agregar"}</button>
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
