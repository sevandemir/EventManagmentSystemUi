import React, { useEffect, useState } from "react";
import {
    Box, Container, Typography, Paper, Chip, Button,
    CircularProgress, Alert, Divider, Dialog, DialogTitle,
    DialogContent, DialogContentText, DialogActions,
} from "@mui/material";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import CancelIcon from "@mui/icons-material/Cancel";
import { registrationService } from "../api/registrationService";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const STATUS_META = {
    CONFIRMED:  { label: "Onaylandı",    bg: "#dcfce7", color: "#15803d" },
    CANCELLED:  { label: "İptal Edildi", bg: "#fee2e2", color: "#b91c1c" },
    CHECKED_IN: { label: "Giriş Yapıldı", bg: "#e0e7ff", color: "#4338ca" },
    EXPIRED:    { label: "Süresi Doldu", bg: "#f1f5f9", color: "#475569" },
};

const MyTicketsPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [registrations, setRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // İptal onay dialog
    const [cancelTarget, setCancelTarget] = useState(null);
    const [cancelling, setCancelling] = useState(false);
    const [cancelError, setCancelError] = useState("");

    useEffect(() => {
        if (!user) { navigate("/login"); return; }
        fetchRegistrations();
    }, [user]);

    const fetchRegistrations = async () => {
        setLoading(true);
        setError("");
        try {
            const data = await registrationService.getMyRegistrations();
            setRegistrations(data);
        } catch (err) {
            setError(err.response?.data?.message || "Biletler yüklenirken hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    const handleCancelConfirm = async () => {
        if (!cancelTarget) return;
        setCancelling(true);
        setCancelError("");
        try {
            await registrationService.cancel(cancelTarget.id);
            // Listeyi güncelle
            setRegistrations((prev) =>
                prev.map((r) =>
                    r.id === cancelTarget.id ? { ...r, status: "CANCELLED" } : r
                )
            );
            setCancelTarget(null);
        } catch (err) {
            setCancelError(err.response?.data?.message || "İptal sırasında hata oluştu.");
        } finally {
            setCancelling(false);
        }
    };

    // Aktif, Geçmiş & İptal biletleri ayır
    const active    = registrations.filter((r) => r.status !== "CANCELLED" && r.status !== "EXPIRED" && r.eventStatus !== "COMPLETED");
    const past      = registrations.filter((r) => r.status === "EXPIRED" || r.eventStatus === "COMPLETED");
    const cancelled = registrations.filter((r) => r.status === "CANCELLED");

    const TicketCard = ({ reg }) => {
        const meta = STATUS_META[reg.status] || { label: reg.status, bg: "#f3f4f6", color: "#6b7280" };
        const isCancellable = reg.status === "CONFIRMED" && reg.eventStatus !== "COMPLETED";

        return (
            <Paper
                sx={{
                    borderRadius: "16px",
                    p: 3,
                    mb: 2,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.07)",
                    borderLeft: `4px solid ${meta.color}`,
                    opacity: reg.status === "CANCELLED" ? 0.65 : 1,
                }}
            >
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 1 }}>
                    <Box>
                        <Typography variant="h6" fontWeight={700} mb={0.5}>
                            {reg.eventTitle}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1 }}>
                            <Chip
                                label={meta.label}
                                size="small"
                                sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 600 }}
                            />
                            <Chip
                                label={reg.ticketType}
                                size="small"
                                icon={<ConfirmationNumberIcon sx={{ fontSize: "14px !important" }} />}
                                sx={{ bgcolor: "#f1f5f9", color: "#475569", fontWeight: 600 }}
                            />
                        </Box>
                    </Box>
                    <Typography fontWeight={700} sx={{ color: "#e94560", fontSize: "1.2rem" }}>
                        {reg.price === 0 ? "Ücretsiz" : `${reg.price} ₺`}
                    </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Box sx={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.7 }}>
                        <CalendarMonthIcon sx={{ fontSize: 16, color: "#94a3b8" }} />
                        <Typography variant="caption" color="text.secondary">
                            {new Date(reg.eventStartTime).toLocaleDateString("tr-TR", {
                                day: "numeric", month: "long", year: "numeric",
                                hour: "2-digit", minute: "2-digit",
                            })}
                        </Typography>
                    </Box>
                    {reg.eventLocation && (
                        <Typography variant="caption" color="text.secondary">
                            📍 {reg.eventLocation}
                        </Typography>
                    )}
                </Box>

                {/* QR KOD GÖRSELI */}
                <Box sx={{ mt: 2, display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
                    {/* QR PNG — backend /qrcodes/{uuid}.png endpoint'inden gelir */}
                    <Box
                        sx={{
                            border: "2px solid #e2e8f0",
                            borderRadius: "10px",
                            p: 1,
                            bgcolor: "#fff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: 100,
                            height: 100,
                            flexShrink: 0,
                        }}
                    >
                        {(reg.status !== "EXPIRED" && reg.eventStatus !== "COMPLETED") ? (
                            <img
                                src={`${(import.meta.env.VITE_API_URL || "http://localhost:9090/api").replace("/api", "")}/qrcodes/${reg.qrCodeUuid}.png`}
                                alt="QR Kod"
                                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                                onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                }}
                            />
                        ) : null}
                        {/* Fallback — QR dosyası yoksa veya süresi dolduysa */}
                        <Box sx={{ 
                            display: (reg.status === "EXPIRED" || reg.eventStatus === "COMPLETED") ? "flex" : "none", 
                            flexDirection: "column", 
                            alignItems: "center", 
                            color: "#94a3b8" 
                        }}>
                            <QrCode2Icon sx={{ fontSize: 32 }} />
                            <Typography variant="caption" sx={{ fontSize: "0.6rem", textAlign: "center" }}>
                                {(reg.status === "EXPIRED" || reg.eventStatus === "COMPLETED") ? "Süresi Doldu" : "Hazırlanıyor"}
                            </Typography>
                        </Box>
                    </Box>

                    {/* UUID ve indir */}
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                            Bilet Kodu
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ fontFamily: "monospace", color: "#475569", wordBreak: "break-all", fontSize: "0.7rem" }}
                        >
                            {reg.qrCodeUuid}
                        </Typography>
                        <Box sx={{ mt: 1 }}>
                            <a
                                href={`${(import.meta.env.VITE_API_URL || "http://localhost:9090/api").replace("/api", "")}/qrcodes/${reg.qrCodeUuid}.png`}
                                download={`bilet-${reg.qrCodeUuid}.png`}
                                style={{ textDecoration: "none" }}
                            >
                                <Button
                                    size="small"
                                    startIcon={<QrCode2Icon />}
                                    variant="outlined"
                                    sx={{
                                        fontSize: "0.72rem",
                                        textTransform: "none",
                                        borderColor: "#e2e8f0",
                                        color: "#475569",
                                        borderRadius: "8px",
                                        "&:hover": { bgcolor: "#f8fafc", borderColor: "#94a3b8" },
                                    }}
                                >
                                    QR İndir
                                </Button>
                            </a>
                        </Box>
                    </Box>
                </Box>

                {reg.checkedIn && (
                    <Typography variant="caption" color="#4338ca" sx={{ display: "block", mt: 1 }}>
                        ✅ Giriş yapıldı:{" "}
                        {new Date(reg.checkInTime).toLocaleString("tr-TR")}
                    </Typography>
                )}

                {/* Değerlendir Butonu */}
                {reg.eventStatus === "COMPLETED" && reg.checkedIn && (
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={() => navigate(`/events/${reg.eventId}`)}
                            sx={{
                                textTransform: "none",
                                fontSize: "0.8rem",
                                borderRadius: "8px",
                                background: "#059669",
                                color: "#fff",
                                "&:hover": { background: "#047857" }
                            }}
                        >
                            Etkinliği Değerlendir & Yorum Yap
                        </Button>
                    </Box>
                )}

                {/* İptal butonu */}
                {isCancellable && (
                    <Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
                        <Button
                            size="small"
                            startIcon={<CancelIcon />}
                            onClick={() => setCancelTarget(reg)}
                            sx={{
                                color: "#ef4444",
                                textTransform: "none",
                                fontSize: "0.8rem",
                                "&:hover": { bgcolor: "#fee2e2" },
                            }}
                        >
                            Kaydı İptal Et
                        </Button>
                    </Box>
                )}
            </Paper>
        );
    };

    return (
        <Box sx={{ minHeight: "100vh", bgcolor: "#f8f9fc", py: 6 }}>
            <Container maxWidth="md">
                {/* Başlık */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" fontWeight={700} mb={0.5}>
                        🎫 Biletlerim
                    </Typography>
                    <Typography color="text.secondary">
                        Kayıtlı olduğunuz etkinlikler
                    </Typography>
                </Box>

                {/* Yüklenme & hata */}
                {loading && (
                    <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                        <CircularProgress sx={{ color: "#e94560" }} />
                    </Box>
                )}
                {!loading && error && (
                    <Alert severity="error" sx={{ borderRadius: "10px" }}>{error}</Alert>
                )}

                {/* İçerik */}
                {!loading && !error && (
                    <>
                        {registrations.length === 0 ? (
                            <Paper sx={{ borderRadius: "16px", p: 6, textAlign: "center" }}>
                                <ConfirmationNumberIcon sx={{ fontSize: 60, color: "#e2e8f0", mb: 2 }} />
                                <Typography color="text.secondary" mb={2}>
                                    Henüz hiç biletiniz yok.
                                </Typography>
                                <Button
                                    variant="contained"
                                    onClick={() => navigate("/events")}
                                    sx={{ background: "#e94560", textTransform: "none", "&:hover": { background: "#c73652" } }}
                                >
                                    Etkinliklere Gözat
                                </Button>
                            </Paper>
                        ) : (
                            <>
                                {/* Aktif biletler */}
                                {active.length > 0 && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={700} mb={2} color="text.secondary">
                                            AKTİF BİLETLER ({active.length})
                                        </Typography>
                                        {active.map((r) => <TicketCard key={r.id} reg={r} />)}
                                    </>
                                )}

                                {/* Geçmiş biletler */}
                                {past.length > 0 && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={700} mt={4} mb={2} color="text.secondary">
                                            GEÇMİŞ BİLETLER ({past.length})
                                        </Typography>
                                        {past.map((r) => <TicketCard key={r.id} reg={r} />)}
                                    </>
                                )}

                                {/* İptal edilenler */}
                                {cancelled.length > 0 && (
                                    <>
                                        <Typography variant="subtitle1" fontWeight={700} mt={4} mb={2} color="text.secondary">
                                            İPTAL EDİLEN BİLETLER ({cancelled.length})
                                        </Typography>
                                        {cancelled.map((r) => <TicketCard key={r.id} reg={r} />)}
                                    </>
                                )}
                            </>
                        )}
                    </>
                )}
            </Container>

            {/* İptal onay dialog */}
            <Dialog open={!!cancelTarget} onClose={() => !cancelling && setCancelTarget(null)}
                    PaperProps={{ sx: { borderRadius: "16px" } }}>
                <DialogTitle fontWeight={700}>Kaydı İptal Et</DialogTitle>
                <DialogContent>
                    {cancelError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: "8px" }}>{cancelError}</Alert>
                    )}
                    <DialogContentText>
                        <strong>{cancelTarget?.eventTitle}</strong> etkinliğine ait{" "}
                        <strong>{cancelTarget?.ticketType}</strong> biletinizi iptal etmek istediğinize emin misiniz?
                        Bu işlem geri alınamaz.
                    </DialogContentText>
                </DialogContent>
                <DialogActions sx={{ p: 2, gap: 1 }}>
                    <Button
                        onClick={() => setCancelTarget(null)}
                        disabled={cancelling}
                        sx={{ textTransform: "none" }}
                    >
                        Vazgeç
                    </Button>
                    <Button
                        onClick={handleCancelConfirm}
                        variant="contained"
                        disabled={cancelling}
                        sx={{
                            background: "#ef4444",
                            textTransform: "none",
                            "&:hover": { background: "#dc2626" },
                        }}
                    >
                        {cancelling ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : "İptal Et"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default MyTicketsPage;
