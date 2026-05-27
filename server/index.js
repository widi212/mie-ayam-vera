const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

/*
|--------------------------------------------------------------------------
| DATABASE SEMENTARA (Mengandalkan Array Transaksi)
|--------------------------------------------------------------------------
*/
let transaksi = [];

/*
|--------------------------------------------------------------------------
| GET DASHBOARD (Otomatis kalkulasi dari transaksi)
|--------------------------------------------------------------------------
*/
app.get("/api/dashboard", (req, res) => {
    const today = new Date();
    let data = {
        pemasukanHariIni: 0, pemasukanBulanIni: 0, pemasukanTahunIni: 0, seluruhPemasukan: 0,
        pengeluaranHariIni: 0, pengeluaranBulanIni: 0, pengeluaranTahunIni: 0, seluruhPengeluaran: 0,
        saldo: 0
    };

    transaksi.forEach(t => {
        const tDate = new Date(t.tanggal);

        const isToday = tDate.getDate() === today.getDate() && tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        const isThisMonth = tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
        const isThisYear = tDate.getFullYear() === today.getFullYear();

        if (t.tipe === "Pemasukan") {
            data.seluruhPemasukan += t.jumlah;
            data.saldo += t.jumlah;
            if (isToday) data.pemasukanHariIni += t.jumlah;
            if (isThisMonth) data.pemasukanBulanIni += t.jumlah;
            if (isThisYear) data.pemasukanTahunIni += t.jumlah;
        } else if (t.tipe === "Pengeluaran") {
            data.seluruhPengeluaran += t.jumlah;
            data.saldo -= t.jumlah;
            if (isToday) data.pengeluaranHariIni += t.jumlah;
            if (isThisMonth) data.pengeluaranBulanIni += t.jumlah;
            if (isThisYear) data.pengeluaranTahunIni += t.jumlah;
        }
    });

    res.json(data);
});

/*
|--------------------------------------------------------------------------
| GET TRANSAKSI
|--------------------------------------------------------------------------
*/
app.get("/api/transaksi", (req, res) => {
    res.json(transaksi);
});

/*
|--------------------------------------------------------------------------
| TAMBAH PEMASUKAN & PENGELUARAN
|--------------------------------------------------------------------------
*/
app.post("/api/pemasukan", (req, res) => {
    const { jumlah, keterangan, kategori } = req.body;
    transaksi.push({
        id: Date.now(),
        tipe: "Pemasukan",
        jumlah: Number(jumlah),
        kategori: kategori || "Lainnya",
        keterangan: keterangan || "-",
        tanggal: new Date(),
    });
    res.json({ success: true, message: "Pemasukan ditambah" });
});

app.post("/api/pengeluaran", (req, res) => {
    const { jumlah, keterangan, kategori } = req.body;
    transaksi.push({
        id: Date.now(),
        tipe: "Pengeluaran",
        jumlah: Number(jumlah),
        kategori: kategori || "Lainnya",
        keterangan: keterangan || "-",
        tanggal: new Date(),
    });
    res.json({ success: true, message: "Pengeluaran ditambah" });
});

/*
|--------------------------------------------------------------------------
| RESET SEMUA DATA (MENGOSONGKAN KE 0)
|--------------------------------------------------------------------------
*/
app.post("/api/reset", (req, res) => {
    transaksi = []; // Mengosongkan data transaksi
    res.json({
        success: true,
        message: "Semua data berhasil direset ke 0"
    });
});

app.listen(3000, () => console.log(`Server berjalan di port 3000`));