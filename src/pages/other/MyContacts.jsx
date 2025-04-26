import React, { useState, useEffect } from "react";
import {
    Grid,
    Card,
    CardContent,
    Typography,
    TextField,
    Button,
    Avatar,
    IconButton,
    Box,
    Pagination,
    InputAdornment
} from "@mui/material";
import { Edit, Delete, Phone, Person, Search } from "@mui/icons-material";
import axios from '../../axiosConfig';
import { useLocation } from "react-router-dom";
import LayoutOne from "../../layouts/LayoutOne";
import Breadcrumb from "../../wrappers/breadcrumb/Breadcrumb";
import withAuth from '../../components/withAuth';

const Contact = () => {
    const { pathname } = useLocation();
    const [contacts, setContacts] = useState([]);
    const [filteredContacts, setFilteredContacts] = useState([]);
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [editingIndex, setEditingIndex] = useState(null);
    const [error, setError] = useState("");
    const [phoneError, setPhoneError] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 9; // Mostrar 9 contactos por página (3 filas de 3)

    useEffect(() => {
        axios.get('/contacts').then(res => {
            setContacts(res.data);
            setFilteredContacts(res.data);
        });
    }, []);

    useEffect(() => {
        const term = searchTerm.toLowerCase();
        const filtered = contacts.filter(c =>
            c.name.toLowerCase().includes(term) ||
            c.phone.includes(term)
        );
        setFilteredContacts(filtered);
        setCurrentPage(1); // reset to first page on new search
    }, [searchTerm, contacts]);

    const handlePhoneChange = (e) => {
        const value = e.target.value;
        if (/^[0-9]*$/.test(value)) {
            setPhone(value.slice(0, 10));
            setPhoneError("");
            if (value.length > 10) setError("Son 10 dígitos");
            else setError("");
        } else {
            setPhoneError("Solo números telefónicos");
            setError("");
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (phone.length !== 10) return setError("Son 10 dígitos");

        const payload = { name, phone };

        if (editingIndex !== null) {
            axios.put(`/contacts/${contacts[editingIndex].id}`, payload).then((res) => {
                const updated = [...contacts];
                updated[editingIndex] = res.data;
                setContacts(updated);
                setEditingIndex(null);
                setName("");
                setPhone("");
            });
        } else {
            axios.post('/contacts', payload).then((res) => {
                setContacts([...contacts, res.data]);
                setName("");
                setPhone("");
            });
        }
    };

    const handleEdit = (index) => {
        const filteredIndex = (currentPage - 1) * itemsPerPage + index;
        setName(filteredContacts[filteredIndex].name);
        setPhone(filteredContacts[filteredIndex].phone);
        setEditingIndex(contacts.findIndex(c => c.id === filteredContacts[filteredIndex].id));
    };

    const handleDelete = (index) => {
        const filteredIndex = (currentPage - 1) * itemsPerPage + index;
        const contactId = filteredContacts[filteredIndex].id;
        axios.delete(`/contacts/${contactId}`).then(() => {
            setContacts(contacts.filter(c => c.id !== contactId));
        });
    };

    const paginatedContacts = filteredContacts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const rows = [];
    for (let i = 0; i < paginatedContacts.length; i += 3) {
        rows.push(paginatedContacts.slice(i, i + 3));
    }

    return (
        <LayoutOne headerTop="visible">
            <Breadcrumb pages={[{ label: "Inicio", path: "/" }, { label: "Mis Contactos", path: pathname }]} />

            <Box p={2}>
                <Grid container spacing={2} justifyContent="center">
                    <Grid item xs={12} md={5} lg={4} sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Card elevation={3} sx={{ p: 3, borderRadius: 3, display: "flex",alignSelf: "flex-start", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 350 }}>
                            <Typography variant="h6" mb={2}>Nuevo Contacto</Typography>
                            <Avatar sx={{ width: 90, height: 90, bgcolor: "grey.300", boxShadow: 2, mb: 2 }}><Person fontSize="large" /></Avatar>
                            <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", alignItems: "center", width: "100%", maxWidth: 280 }}>
                                <TextField fullWidth label="Nombre del contacto" value={name} onChange={(e) => setName(e.target.value)} margin="normal" required />
                                <TextField fullWidth label="Teléfono" value={phone} onChange={handlePhoneChange} margin="normal" required inputProps={{ maxLength: 10 }} />
                                {(phoneError || error) && <Typography variant="caption" color="error" textAlign="center" mt={1}>{phoneError || error}</Typography>}
                                <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, borderRadius: "50px", fontWeight: "bold", textTransform: "none", bgcolor: "#4B4DED", "&:hover": { bgcolor: "#373fcf" } }}>{editingIndex !== null ? "Actualizar" : "Agregar"}</Button>
                            </Box>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={7} lg={8}>
                        <Box display="flex" justifyContent="center" mb={2}>
                            <TextField
                                placeholder="Buscar Contacto"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                margin="normal"
                                sx={{ width: "100%", maxWidth: 360, '& .MuiOutlinedInput-root': { borderRadius: "30px" } }}
                                InputProps={{ startAdornment: (<InputAdornment position="start"><Search /></InputAdornment>) }}
                            />
                        </Box>
                        {rows.map((group, rowIndex) => (
                            <Grid container spacing={2} justifyContent="center" key={rowIndex} sx={{ mb: 2 }}>
                                {group.map((contact, index) => (
                                    <Grid
                                        item
                                        xs={12}
                                        sm={6}
                                        md={4}
                                        key={contact.id}
                                        sx={{ display: "flex", justifyContent: "center" }}
                                    >
                                        <Card elevation={2} sx={{ width: "100%", maxWidth: 360 }}>
                                            <CardContent sx={{ display: "flex", alignItems: "center" }}>
                                                <Avatar sx={{ mr: 2 }}><Person /></Avatar>
                                                <Box flexGrow={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold">{contact.name}</Typography>
                                                    <Typography variant="body2" color="textSecondary">
                                                        <Phone fontSize="small" sx={{ mr: 0.5 }} />
                                                        {contact.phone}
                                                    </Typography>
                                                </Box>
                                                <IconButton onClick={() => handleEdit(index + rowIndex * 3)}><Edit color="primary" /></IconButton>
                                                <IconButton onClick={() => handleDelete(index + rowIndex * 3)}><Delete color="error" /></IconButton>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                            </Grid>
                        ))}



                        {filteredContacts.length > itemsPerPage && (
                            <Box mt={4} display="flex" justifyContent="center">
                                <Pagination
                                    count={Math.ceil(filteredContacts.length / itemsPerPage)}
                                    page={currentPage}
                                    onChange={(e, value) => setCurrentPage(value)}
                                    color="primary"
                                />
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </Box>
        </LayoutOne>
    );
};

export default withAuth(Contact);
