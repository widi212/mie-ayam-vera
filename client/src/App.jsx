import { motion } from "framer-motion";
import axios from "axios";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import { Soup, Download, Calendar, Trash2 } from "lucide-react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

export default function App() {
    const [activeMenu, setActiveMenu] = useState("dashboard");

    // State Data
    const [dataDash, setDataDash] = useState({
        pemasukanHariIni: 0, pemasukanBulanIni: 0, pemasukanTahunIni: 0, seluruhPemasukan: 0,
        pengeluaranHariIni: 0, pengeluaranBulanIni: 0, pengeluaranTahunIni: 0, seluruhPengeluaran: 0,
        saldo: 0
    });
    const [transaksiList, setTransaksiList] = useState([]);

    // State Form
    const [nominal, setNominal] = useState("");
    const [keterangan, setKeterangan] = useState("");
    const [kategori, setKategori] = useState("Penjualan Aplikasi");

    // State Filter Laporan & Grafik
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [chartStartDate, setChartStartDate] = useState("");
    const [chartEndDate, setChartEndDate] = useState("");

    const formatRp = (angka) => `Rp. ${angka.toLocaleString("id-ID")} ,-`;

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
    };

    const loadData = async () => {
        try {
            const resDash = await axios.get("http://localhost:3000/api/dashboard");
            setDataDash(resDash.data);
            const resTrans = await axios.get("http://localhost:3000/api/transaksi");
            setTransaksiList(resTrans.data);
        } catch (error) {
            console.error("Gagal memuat data", error);
        }
    };

    useEffect(() => { loadData(); }, []);

    const submitTransaksi = async (tipe) => {
        if (!nominal || !keterangan) return alert("Harap isi nominal dan keterangan!");
        const endpoint = tipe === "pemasukan" ? "/api/pemasukan" : "/api/pengeluaran";

        await axios.post(`http://localhost:3000${endpoint}`, {
            jumlah: Number(nominal), keterangan, kategori
        });

        setNominal(""); setKeterangan("");
        loadData();
    };

    // FUNGSI RESET DATA KE 0
    const handleReset = async () => {
        const konfirmasi = window.confirm(
            "Apakah Anda yakin ingin mereset semua data pemasukan dan pengeluaran menjadi 0? Tindakan ini akan menghapus seluruh riwayat transaksi dan tidak bisa dibatalkan."
        );

        if (konfirmasi) {
            try {
                await axios.post("http://localhost:3000/api/reset");
                alert("Semua data berhasil direset ke 0.");
                loadData(); // Memperbarui tampilan dashboard dan tabel kas
            } catch (error) {
                console.error("Gagal mereset data", error);
                alert("Gagal mereset data keuangan. Pastikan server backend berjalan.");
            }
        }
    };

    // Filter Laporan Buku Kas
    const filteredTransaksi = transaksiList.filter(item => {
        if (!startDate && !endDate) return true;
        const itemDate = new Date(item.tanggal).setHours(0, 0, 0, 0);
        const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : -Infinity;
        const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : Infinity;
        return itemDate >= start && itemDate <= end;
    });

    // Proses Data untuk Grafik
    const getChartData = () => {
        const filteredForChart = transaksiList.filter(item => {
            if (!chartStartDate && !chartEndDate) return true;
            const itemDate = new Date(item.tanggal).setHours(0, 0, 0, 0);
            const start = chartStartDate ? new Date(chartStartDate).setHours(0, 0, 0, 0) : -Infinity;
            const end = chartEndDate ? new Date(chartEndDate).setHours(23, 59, 59, 999) : Infinity;
            return itemDate >= start && itemDate <= end;
        });

        const groupedData = {};

        filteredForChart.forEach(t => {
            const dateStr = formatDate(t.tanggal);
            if (!groupedData[dateStr]) {
                groupedData[dateStr] = { tanggal: dateStr, Pemasukan: 0, Pengeluaran: 0 };
            }
            if (t.tipe === "Pemasukan") groupedData[dateStr].Pemasukan += t.jumlah;
            if (t.tipe === "Pengeluaran") groupedData[dateStr].Pengeluaran += t.jumlah;
        });

        return Object.values(groupedData).sort((a, b) => {
            const [d1, m1, y1] = a.tanggal.split('-');
            const [d2, m2, y2] = b.tanggal.split('-');
            return new Date(y1, m1 - 1, d1) - new Date(y2, m2 - 1, d2);
        });
    };

    const exportToExcel = () => {
        if (filteredTransaksi.length === 0) return alert("Tidak ada data untuk diexport!");
        const dataToExport = filteredTransaksi.map((t, index) => ({
            NO: index + 1,
            TANGGAL: formatDate(t.tanggal),
            KATEGORI: t.kategori,
            KETERANGAN: t.keterangan,
            PEMASUKAN: t.tipe === "Pemasukan" ? t.jumlah : 0,
            PENGELUARAN: t.tipe === "Pengeluaran" ? t.jumlah : 0
        }));
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Buku Kas");
        XLSX.writeFile(workbook, "Rekap_Laporan_Keuangan.xlsx");
    };

    return (
        <div className="min-h-screen bg-[#f4f6f9] text-gray-800 flex font-sans">
            {/* SIDEBAR */}
            <div className="w-64 bg-[#222d32] text-white p-5 shadow-xl z-10">
                <div className="flex items-center gap-3 mb-10 border-b border-gray-600 pb-4">
                    <Soup size={40} className="text-yellow-400" />
                    <div>
                        <h1 className="text-xl font-bold tracking-wide">Mie Ayam Vera</h1>
                        <p className="text-gray-400 text-xs flex items-center gap-1 mt-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Online
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <p className="text-xs text-gray-500 mb-2 uppercase font-semibold tracking-wider">Main Navigation</p>
                    <button onClick={() => setActiveMenu("dashboard")} className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${activeMenu === "dashboard" ? "bg-[#1a2226] border-l-4 border-blue-500 text-white" : "text-gray-300 hover:bg-[#1a2226] hover:text-white"}`}>
                        Dashboard
                    </button>
                    <button onClick={() => setActiveMenu("bukuKas")} className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${activeMenu === "bukuKas" ? "bg-[#1a2226] border-l-4 border-blue-500 text-white" : "text-gray-300 hover:bg-[#1a2226] hover:text-white"}`}>
                        Buku Kas & Laporan
                    </button>
                </div>
            </div>

            {/* CONTENT */}
            <div className="flex-1 p-8 overflow-y-auto max-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-extrabold text-gray-800">
                        {activeMenu === "dashboard" ? "Dashboard Control Panel" : "Buku Kas"}
                    </h1>

                    {/* BAGIAN KANAN ATAS: TOMBOL RESET & SALDO */}
                    <div className="flex items-center gap-4">
                        {/* Tombol Reset hanya muncul jika menu aktif adalah bukuKas */}
                        {activeMenu === "bukuKas" && (
                            <button
                                onClick={handleReset}
                                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-2xl font-semibold transition shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
                            >
                                <Trash2 size={16} /> Reset Semua Data
                            </button>
                        )}

                        <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3">
                            <span className="text-gray-500 font-medium">Saldo Saat Ini:</span>
                            <span className={`text-xl font-bold ${dataDash.saldo >= 0 ? "text-green-600" : "text-red-600"}`}>
                                {formatRp(dataDash.saldo)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DASHBOARD VIEW */}
                {activeMenu === "dashboard" && (
                    <div className="flex flex-col gap-8">
                        {/* 8 CARDS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* PEMASUKAN */}
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-green-400 to-green-600 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pemasukanHariIni)}</h3>
                                <p className="mt-2 text-green-100 font-medium">Pemasukan Hari Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pemasukanBulanIni)}</h3>
                                <p className="mt-2 text-blue-100 font-medium">Pemasukan Bulan Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-orange-400 to-orange-500 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pemasukanTahunIni)}</h3>
                                <p className="mt-2 text-orange-100 font-medium">Pemasukan Tahun Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-gray-700 to-gray-900 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.seluruhPemasukan)}</h3>
                                <p className="mt-2 text-gray-300 font-medium">Seluruh Pemasukan</p>
                            </motion.div>

                            {/* PENGELUARAN */}
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-red-400 to-red-500 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pengeluaranHariIni)}</h3>
                                <p className="mt-2 text-red-100 font-medium">Pengeluaran Hari Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-red-500 to-red-600 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pengeluaranBulanIni)}</h3>
                                <p className="mt-2 text-red-100 font-medium">Pengeluaran Bulan Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-red-600 to-red-700 text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.pengeluaranTahunIni)}</h3>
                                <p className="mt-2 text-red-100 font-medium">Pengeluaran Tahun Ini</p>
                            </motion.div>
                            <motion.div whileHover={{ y: -5 }} className="bg-gradient-to-br from-gray-800 to-black text-white p-6 rounded-2xl shadow-lg">
                                <h3 className="text-2xl font-bold drop-shadow-sm">{formatRp(dataDash.seluruhPengeluaran)}</h3>
                                <p className="mt-2 text-gray-300 font-medium">Seluruh Pengeluaran</p>
                            </motion.div>
                        </div>

                        {/* GRAFIK */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-700">Grafik Arus Kas</h2>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-1.5">
                                        <Calendar size={16} className="text-gray-400 mr-2" />
                                        <input type="date" value={chartStartDate} onChange={(e) => setChartStartDate(e.target.value)} className="bg-transparent outline-none text-sm text-gray-600" />
                                    </div>
                                    <span className="text-gray-400">-</span>
                                    <div className="flex items-center bg-gray-50 border rounded-xl px-3 py-1.5">
                                        <input type="date" value={chartEndDate} onChange={(e) => setChartEndDate(e.target.value)} className="bg-transparent outline-none text-sm text-gray-600" />
                                    </div>
                                </div>
                            </div>
                            <div className="w-full h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={getChartData()} margin={{ top: 10, right: 30, left: 20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="tanggal" tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} dy={10} />
                                        <YAxis tickFormatter={(value) => `Rp ${value / 1000}k`} tick={{ fill: '#888', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
                                        <Tooltip
                                            formatter={(value) => formatRp(value)}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        />
                                        <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                        <Line type="monotone" dataKey="Pemasukan" stroke="#22c55e" strokeWidth={3} dot={{ r: 4, fill: '#22c55e' }} activeDot={{ r: 6 }} />
                                        <Line type="monotone" dataKey="Pengeluaran" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, fill: '#ef4444' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* BUKU KAS VIEW */}
                {activeMenu === "bukuKas" && (
                    <div className="flex flex-col gap-6">
                        {/* INPUT */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <h2 className="text-lg font-bold mb-4 text-gray-700">Input Transaksi Baru</h2>
                            <div className="grid md:grid-cols-3 gap-4 mb-5">
                                <select value={kategori} onChange={(e) => setKategori(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 rounded-2xl outline-none w-full focus:ring-2 focus:ring-blue-500 transition">
                                    <option value="Penjualan Aplikasi">Penjualan</option>
                                    <option value="Keperluan Usaha">Bahan Baku</option>
                                    <option value="Keluarga">Pribadi / Keluarga</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                                <input type="text" placeholder="Keterangan..." value={keterangan} onChange={(e) => setKeterangan(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 rounded-2xl outline-none w-full focus:ring-2 focus:ring-blue-500 transition" />
                                <input type="number" placeholder="Nominal Rp." value={nominal} onChange={(e) => setNominal(e.target.value)} className="bg-gray-50 border border-gray-200 p-3 rounded-2xl outline-none w-full focus:ring-2 focus:ring-blue-500 transition" />
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => submitTransaksi("pemasukan")} className="bg-green-500 text-white hover:bg-green-600 px-6 py-2.5 rounded-2xl font-semibold transition shadow-md hover:shadow-lg">
                                    + Pemasukan
                                </button>
                                <button onClick={() => submitTransaksi("pengeluaran")} className="bg-red-500 text-white hover:bg-red-600 px-6 py-2.5 rounded-2xl font-semibold transition shadow-md hover:shadow-lg">
                                    - Pengeluaran
                                </button>
                            </div>
                        </div>

                        {/* LAPORAN */}
                        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-lg font-bold text-gray-700">Rekap Laporan</h2>
                                <button onClick={exportToExcel} className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold hover:bg-emerald-700 transition flex items-center gap-2 shadow-sm">
                                    <Download size={16} /> Export Excel
                                </button>
                            </div>

                            {/* FILTER TANGGAL MODERN (GAUL) */}
                            <div className="flex flex-wrap items-center gap-4 mb-6">
                                <div className="flex items-center bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
                                    {/* Tanggal Mulai */}
                                    <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-2 rounded-xl relative group cursor-pointer">
                                        <Calendar size={18} className="text-blue-500 mr-3 group-hover:scale-110 transition-transform" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Mulai Tanggal</span>
                                            <input
                                                type="date"
                                                value={startDate}
                                                onChange={(e) => setStartDate(e.target.value)}
                                                className="bg-transparent outline-none text-sm font-semibold text-gray-700 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                            />
                                        </div>
                                    </div>

                                    {/* Garis Separator */}
                                    <div className="px-3 flex items-center justify-center">
                                        <span className="w-4 h-[2px] bg-gray-300 rounded-full"></span>
                                    </div>

                                    {/* Tanggal Sampai */}
                                    <div className="flex items-center bg-gray-50 hover:bg-gray-100 transition-colors px-4 py-2 rounded-xl relative group cursor-pointer">
                                        <Calendar size={18} className="text-emerald-500 mr-3 group-hover:scale-110 transition-transform" />
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Sampai Tanggal</span>
                                            <input
                                                type="date"
                                                value={endDate}
                                                onChange={(e) => setEndDate(e.target.value)}
                                                className="bg-transparent outline-none text-sm font-semibold text-gray-700 cursor-pointer [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Tombol Reset Filter */}
                                {(startDate || endDate) && (
                                    <button
                                        onClick={() => { setStartDate(""); setEndDate(""); }}
                                        className="text-sm font-bold text-red-500 bg-red-50 hover:bg-red-500 hover:text-white px-5 py-3 rounded-xl transition-all shadow-sm flex items-center gap-2"
                                    >
                                        ✕ Reset
                                    </button>
                                )}
                            </div>

                            {/* TABEL DATA */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm whitespace-nowrap">
                                    <thead className="bg-gray-50 text-gray-600">
                                        <tr>
                                            <th className="py-4 px-4 rounded-tl-xl font-semibold">NO</th>
                                            <th className="py-4 px-4 font-semibold">TANGGAL</th>
                                            <th className="py-4 px-4 font-semibold">KATEGORI</th>
                                            <th className="py-4 px-4 font-semibold">KETERANGAN</th>
                                            <th className="py-4 px-4 text-right font-semibold">PEMASUKAN</th>
                                            <th className="py-4 px-4 text-right rounded-tr-xl font-semibold">PENGELUARAN</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredTransaksi.map((item, index) => (
                                            <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                                <td className="py-4 px-4 text-gray-500">{index + 1}</td>
                                                <td className="py-4 px-4">{formatDate(item.tanggal)}</td>
                                                <td className="py-4 px-4">
                                                    <span className="bg-gray-100 px-3 py-1 rounded-full text-xs text-gray-600 font-medium">{item.kategori}</span>
                                                </td>
                                                <td className="py-4 px-4 text-gray-700">{item.keterangan}</td>
                                                <td className="py-4 px-4 text-right font-medium text-green-600">
                                                    {item.tipe === "Pemasukan" ? formatRp(item.jumlah) : "-"}
                                                </td>
                                                <td className="py-4 px-4 text-right font-medium text-red-600">
                                                    {item.tipe === "Pengeluaran" ? formatRp(item.jumlah) : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredTransaksi.length === 0 && (
                                            <tr><td colSpan="6" className="py-12 text-center text-gray-400">Data tidak ditemukan.</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}