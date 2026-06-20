export const excelSeed = {
  "sourceFile": "D:\\Download\\ACC  Exprogram Test Apr20.xlsx",
  "accounts": [
    {
      "code": "1011",
      "nameLao": "ເງິນສົດເປັນກີບ",
      "nameEn": "Cash in LAK",
      "type": "Asset",
      "balance": 8075000,
      "debit": 8075000,
      "credit": 0
    },
    {
      "code": "1012",
      "nameLao": "ເງິນສົດເປັນເງິນຕ່າງປະເທດ",
      "nameEn": "Cash in foreign currency",
      "type": "Asset",
      "balance": 895000,
      "debit": 895000,
      "credit": 0
    },
    {
      "code": "1013",
      "nameLao": "ເງິນສົດຍ່ອຍ",
      "nameEn": "Petty cash",
      "type": "Asset",
      "balance": 140000,
      "debit": 140000,
      "credit": 0
    },
    {
      "code": "1014",
      "nameLao": "ເງິນສົດກຳລັງນຳຝາກ",
      "nameEn": "Cash in transit",
      "type": "Asset",
      "balance": 100000,
      "debit": 100000,
      "credit": 0
    },
    {
      "code": "1017",
      "nameLao": "ເງິນສົດລ່ວງໜ້າ",
      "nameEn": "Cash advance",
      "type": "Asset",
      "balance": 10000,
      "debit": 10000,
      "credit": 0
    },
    {
      "code": "1021",
      "nameLao": "ເງິນຝາກທະນາຄານເປັນກີບ",
      "nameEn": "Bank deposits in LAK",
      "type": "Asset",
      "balance": 23510000,
      "debit": 23510000,
      "credit": 0
    },
    {
      "code": "1022",
      "nameLao": "ເງິນຝາກທະນາຄານເປັນເງິນຕ່າງປະເທດ",
      "nameEn": "Bank deposits in foreign currency",
      "type": "Asset",
      "balance": 6345000,
      "debit": 6345000,
      "credit": 0
    },
    {
      "code": "1023",
      "nameLao": "ເງິນຝາກຄັງເງິນແຫ່ງຊາດ",
      "nameEn": "Treasury deposits",
      "type": "Asset",
      "balance": 1200000,
      "debit": 1200000,
      "credit": 0
    },
    {
      "code": "1024",
      "nameLao": "ເງິນຝາກສະຖາບັນການເງິນອື່ນໆ",
      "nameEn": "Other financial deposits",
      "type": "Asset",
      "balance": 1065000,
      "debit": 1065000,
      "credit": 0
    },
    {
      "code": "1028",
      "nameLao": "ດອກເບ້ຍຕ້ອງຮັບ",
      "nameEn": "Interest receivable",
      "type": "Asset",
      "balance": 20000,
      "debit": 20000,
      "credit": 0
    },
    {
      "code": "1091",
      "nameLao": "ຄ່າສູນເສຍມູນຄ່າ ເງິນສົດຍ່ອຍ ເງິນລ່ວງໜ້າ",
      "nameEn": "Mapped account",
      "type": "Asset",
      "balance": 15000,
      "debit": 0,
      "credit": 15000
    },
    {
      "code": "1092",
      "nameLao": "ຄ່າສູນເສຍມູນຄ່າ ເງິນກຳລັງນຳໄປຝາກທະນາຄານ",
      "nameEn": "Mapped account",
      "type": "Asset",
      "balance": 12000,
      "debit": 0,
      "credit": 12000
    },
    {
      "code": "1111",
      "nameLao": "ເງິນກູ້ຢືມໄລຍະສັ້ນ",
      "nameEn": "Short-term loans receivable",
      "type": "Asset",
      "balance": 280000,
      "debit": 280000,
      "credit": 0
    },
    {
      "code": "1112",
      "nameLao": "ໜີ້​ຕ້ອງ​ຮັບ ຈາກ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້",
      "nameEn": "Mapped account",
      "type": "Asset",
      "balance": 190000,
      "debit": 190000,
      "credit": 0
    }
  ],
  "journalEntries": [
    {
      "id": "JV-2025-001",
      "description": "​ເວ​ລາ​ເອົາ​ເງິນ​ໃຫ້​ພາກ​ສ່ວນ​ອື່ນ ກູ້​ຢືມ",
      "lines": [
        {
          "account": "1111",
          "side": "debit",
          "amount": 250000
        },
        {
          "account": "1011",
          "side": "credit",
          "amount": 50000
        },
        {
          "account": "1012",
          "side": "credit",
          "amount": 100000
        },
        {
          "account": "1021",
          "side": "credit",
          "amount": 80000
        },
        {
          "account": "1022",
          "side": "credit",
          "amount": 20000
        }
      ]
    },
    {
      "id": "JV-2025-002",
      "description": "ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ເອົາ​ເງິນ​ມາ​ທົດ​ແທນ",
      "lines": [
        {
          "account": "1011",
          "side": "debit",
          "amount": 30000
        },
        {
          "account": "1012",
          "side": "debit",
          "amount": 80000
        },
        {
          "account": "1021",
          "side": "debit",
          "amount": 55000
        },
        {
          "account": "1022",
          "side": "debit",
          "amount": 15000
        },
        {
          "account": "1111",
          "side": "credit",
          "amount": 170000
        },
        {
          "account": "1118",
          "side": "credit",
          "amount": 10000
        }
      ]
    },
    {
      "id": "JV-2025-003",
      "description": "ເວ​ລາ​ໄດ້​ຮັບ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້ ຈາກ​ພາກ​ສ່ວນ​ອື່ນ",
      "lines": [
        {
          "account": "1112",
          "side": "debit",
          "amount": 120000
        },
        {
          "account": "1116",
          "side": "credit",
          "amount": 20000
        },
        {
          "account": "112",
          "side": "credit",
          "amount": 80000
        },
        {
          "account": "1136",
          "side": "credit",
          "amount": 20000
        }
      ]
    },
    {
      "id": "JV-2025-004",
      "description": "ເວ​ລາ​ພາກ​ສ່ວນ​ອື່ນ ນຳ​ເງິນ​ມາ​ທົດ​ແທນ ຕາມ​ສັນ​ຍາ​ໃບ​ຢັ້ງ​ຢືນ​ໜີ້",
      "lines": [
        {
          "account": "1011",
          "side": "debit",
          "amount": 20000
        },
        {
          "account": "1012",
          "side": "debit",
          "amount": 15000
        },
        {
          "account": "1021",
          "side": "debit",
          "amount": 30000
        },
        {
          "account": "1022",
          "side": "debit",
          "amount": 20000
        },
        {
          "account": "1112",
          "side": "credit",
          "amount": 80000
        },
        {
          "account": "1118",
          "side": "credit",
          "amount": 5000
        }
      ]
    },
    {
      "id": "JV-2025-005",
      "description": "ເວ​ລາ​ຊື້​ຮຸ້ນ​ສາ​ມັນ ນຳ​ບໍ​ລິ​ສັດ​ອື່ນ",
      "lines": [
        {
          "account": "1113",
          "side": "debit",
          "amount": 100000
        },
        {
          "account": "1021",
          "side": "credit",
          "amount": 100000
        }
      ]
    },
    {
      "id": "JV-2025-006",
      "description": "ເວ​ລາ​ຂາຍ​ຮຸ້ນ​ສາ​ມັນ ອອກ",
      "lines": [
        {
          "account": "1021",
          "side": "debit",
          "amount": 120000
        },
        {
          "account": "1113",
          "side": "credit",
          "amount": 100000
        },
        {
          "account": "766",
          "side": "credit",
          "amount": 20000
        }
      ]
    }
  ],
  "workbookSummary": [
    {
      "sheet": "Chart",
      "dimension": "A1:G661",
      "values": 3626
    },
    {
      "sheet": "GL",
      "dimension": "A1:K1824",
      "values": 8150
    },
    {
      "sheet": "Balance Be",
      "dimension": "A1:L666",
      "values": 5888
    },
    {
      "sheet": "GL2",
      "dimension": "A2:I2108",
      "values": 16686
    },
    {
      "sheet": "B RP",
      "dimension": "A1:H294",
      "values": 1170
    },
    {
      "sheet": "Balance Af",
      "dimension": "A1:L661",
      "values": 7421
    },
    {
      "sheet": "IC acc",
      "dimension": "A1:F32",
      "values": 75
    },
    {
      "sheet": "Taxxx",
      "dimension": "A2:J22",
      "values": 43
    },
    {
      "sheet": "ICtax",
      "dimension": "A1:E31",
      "values": 74
    },
    {
      "sheet": "DS",
      "dimension": "A1:E32",
      "values": 93
    },
    {
      "sheet": "SS",
      "dimension": "A1:G37",
      "values": 104
    },
    {
      "sheet": "Direct CF",
      "dimension": "A1:D37",
      "values": 44
    },
    {
      "sheet": "Ind CF",
      "dimension": "A1:D36",
      "values": 42
    },
    {
      "sheet": "Equity",
      "dimension": "A1:G21",
      "values": 28
    },
    {
      "sheet": "Tecnic ACC",
      "dimension": "A1:N428",
      "values": 1178
    },
    {
      "sheet": "Remember",
      "dimension": "A1:G651",
      "values": 22
    },
    {
      "sheet": "Change Equity",
      "dimension": "A1:G22",
      "values": 64
    }
  ]
};
