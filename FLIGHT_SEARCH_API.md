# Flight Search API Documentation

## Endpoint: Tìm kiếm chuyến bay

### POST `/flights/search`

API này cho phép tìm kiếm chuyến bay dựa trên thông tin của người dùng.

---

## Request Body

### One-way Trip Example:
```json
{
  "departure_airport_id": "987e2fc4-7c69-4b23-ba91-ec00fe9ba82e",
  "destination_airport_id": "181760d3-60f0-4048-99cb-d8a72303d562",
  "departure_date": "2025-10-09",
  "trip_type": "oneway",
  "adults": 1,
  "children": 0,
  "infants": 0
}
```

### Round-trip Example:
```json
{
  "departure_airport_id": "987e2fc4-7c69-4b23-ba91-ec00fe9ba82e",
  "destination_airport_id": "181760d3-60f0-4048-99cb-d8a72303d562",
  "departure_date": "2025-10-09",
  "return_date": "2025-10-10",
  "trip_type": "roundtrip",
  "adults": 2,
  "children": 1,
  "infants": 0
}
```

### Các trường (Fields):

| Field | Type | Required | Description | Example |
|-------|------|----------|-------------|---------|
| `departure_airport_id` | UUID | ✅ Yes | ID của sân bay đi | `"987e2fc4-7c69-4b23-ba91-ec00fe9ba82e"` |
| `destination_airport_id` | UUID | ✅ Yes | ID của sân bay đến | `"181760d3-60f0-4048-99cb-d8a72303d562"` |
| `departure_date` | string (YYYY-MM-DD) | ✅ Yes | Ngày khởi hành | `"2025-10-09"` |
| `return_date` | string (YYYY-MM-DD) | ❌ No* | Ngày về (optional cho roundtrip) | `"2025-10-10"` |
| `trip_type` | `"oneway"` \| `"roundtrip"` | ✅ Yes | Loại chuyến bay | `"oneway"` |
| `adults` | number (≥1) | ✅ Yes | Số người lớn | `1` |
| `children` | number (≥0) | ✅ Yes | Số trẻ em (2-12 tuổi) | `0` |
| `infants` | number (≥0) | ✅ Yes | Số em bé (<2 tuổi) | `0` |

*Note: `return_date` optional, nhưng nên có nếu `trip_type` = `"roundtrip"`

---

## Response Format

### Success Response (200 OK) - One-way Trip

```json
{
  "trip_type": "oneway",
  "passengers": {
    "adults": 1,
    "children": 0,
    "infants": 0,
    "total": 1
  },
  "outbound": {
    "departure_date": "2025-10-09",
    "flights": [
      {
        "flight_id": "f1234567-1234-1234-1234-123456789012",
        "flight_number": "VN100",
        "airline": {
          "name": "Vietnam Airlines",
          "code": "VN"
        },
        "departure": {
          "airport": {
            "id": "987e2fc4-7c69-4b23-ba91-ec00fe9ba82e",
            "iata_code": "SGN",
            "name": "Tan Son Nhat International Airport",
            "city": "Ho Chi Minh City",
            "country": "Vietnam"
          },
          "time": "2025-10-09T06:00:00",
          "actual_time": null
        },
        "arrival": {
          "airport": {
            "id": "181760d3-60f0-4048-99cb-d8a72303d562",
            "iata_code": "HAN",
            "name": "Noi Bai International Airport",
            "city": "Hanoi",
            "country": "Vietnam"
          },
          "time": "2025-10-09T08:15:00",
          "actual_time": null
        },
        "duration": {
          "hours": 2,
          "minutes": 15,
          "total_minutes": 135,
          "formatted": "2h 15m"
        },
        "aircraft": {
          "id": "ac123...",
          "model": "Airbus A321",
          "total_seats": 184
        },
        "status": "SCHEDULED",
        "available_seats": 150,
        "pricing": {
          "adult_price": 1500000,
          "child_price": 1125000,
          "infant_price": 150000,
          "total_price": 1500000,
          "currency": "VND",
          "breakdown": {
            "adults": {
              "count": 1,
              "unit_price": 1500000,
              "total": 1500000
            },
            "children": null,
            "infants": null
          }
        },
        "fare_buckets": [
          {
            "fare_bucket_id": "fb123...",
            "available_seats": 100,
            "total_seats": 120,
            "fare_bucket": {
              "code": "ECO",
              "class": "ECONOMY",
              "description": "Economy Class"
            }
          },
          {
            "fare_bucket_id": "fb456...",
            "available_seats": 50,
            "total_seats": 64,
            "fare_bucket": {
              "code": "BUS",
              "class": "BUSINESS",
              "description": "Business Class"
            }
          }
        ]
      }
    ]
  },
  "return": null
}
```

### Success Response - Round-trip

Nếu `trip_type` = `"roundtrip"`, response sẽ có thêm field `return`:

```json
{
  "trip_type": "roundtrip",
  "passengers": { ... },
  "outbound": { ... },
  "return": {
    "departure_date": "2025-10-10",
    "flights": [
      {
        "flight_id": "...",
        "flight_number": "VN105",
        "airline": { ... },
        "departure": { ... },
        "arrival": { ... },
        "duration": { ... },
        "pricing": {
          "adult_price": 1600000,
          "child_price": 1200000,
          "infant_price": 160000,
          "total_price": 3600000,
          "currency": "VND",
          "breakdown": {
            "adults": {
              "count": 2,
              "unit_price": 1600000,
              "total": 3200000
            },
            "children": {
              "count": 1,
              "unit_price": 1200000,
              "total": 1200000
            },
            "infants": null
          }
        }
      }
    ]
  }
}
```

---

## Error Responses

### 400 Bad Request - Dữ liệu không hợp lệ

```json
{
  "statusCode": 400,
  "message": [
    "departure_airport_id must be a UUID",
    "departure_date must be a valid ISO 8601 date string",
    "adults must be an integer number",
    "adults must not be less than 1"
  ],
  "error": "Bad Request"
}
```

**Nguyên nhân:**
- Thiếu trường bắt buộc
- Sai định dạng dữ liệu (UUID, date)
- Giá trị không hợp lệ (ví dụ: adults = 0)

---

## Logic tìm kiếm

### 1. Tìm chuyến bay phù hợp
- Tìm các chuyến bay theo tuyến đường (departure_airport_id → destination_airport_id)
- Lọc theo ngày khởi hành (trong ngày được chọn, từ 00:00:00 đến 23:59:59)
- Sắp xếp theo thời gian khởi hành (sớm nhất trước)

### 2. Kiểm tra ghế trống
- Tính tổng số ghế trống từ tất cả fare buckets
- Chỉ trả về chuyến bay còn đủ ghế cho tổng số hành khách

### 3. Tính giá
- Lấy giá vé cho từng loại hành khách (ADULT, CHILD, INFANT)
- Chọn giá thấp nhất cho mỗi loại từ các fare buckets
- Default nếu không có giá cụ thể:
  - Child: 75% giá người lớn
  - Infant: 10% giá người lớn
- **Tổng giá** = (adult_price × adults) + (child_price × children) + (infant_price × infants)

### 4. Tính thời gian bay
- Duration = scheduled_arrival_local - scheduled_departure_local
- Tự động format thành "Xh Ym"

---

## Ví dụ sử dụng

### cURL - One-way

```bash
curl -X POST http://localhost:3000/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "departure_airport_id": "987e2fc4-7c69-4b23-ba91-ec00fe9ba82e",
    "destination_airport_id": "181760d3-60f0-4048-99cb-d8a72303d562",
    "departure_date": "2025-10-09",
    "trip_type": "oneway",
    "adults": 1,
    "children": 0,
    "infants": 0
  }'
```

### cURL - Round-trip

```bash
curl -X POST http://localhost:3000/flights/search \
  -H "Content-Type: application/json" \
  -d '{
    "departure_airport_id": "987e2fc4-7c69-4b23-ba91-ec00fe9ba82e",
    "destination_airport_id": "181760d3-60f0-4048-99cb-d8a72303d562",
    "departure_date": "2025-10-09",
    "return_date": "2025-10-10",
    "trip_type": "roundtrip",
    "adults": 2,
    "children": 1,
    "infants": 0
  }'
```

### JavaScript (Fetch)

```javascript
const searchFlights = async () => {
  const response = await fetch('http://localhost:3000/flights/search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      departure_airport_id: '987e2fc4-7c69-4b23-ba91-ec00fe9ba82e',
      destination_airport_id: '181760d3-60f0-4048-99cb-d8a72303d562',
      departure_date: '2025-10-09',
      trip_type: 'oneway',
      adults: 1,
      children: 0,
      infants: 0
    })
  });

  const data = await response.json();
  console.log('Outbound flights:', data.outbound.flights);
};
```

### Axios

```javascript
import axios from 'axios';

const searchFlights = async () => {
  try {
    const { data } = await axios.post('http://localhost:3000/flights/search', {
      departure_airport_id: '987e2fc4-7c69-4b23-ba91-ec00fe9ba82e',
      destination_airport_id: '181760d3-60f0-4048-99cb-d8a72303d562',
      departure_date: '2025-10-09',
      return_date: '2025-10-10',
      trip_type: 'roundtrip',
      adults: 1,
      children: 0,
      infants: 0
    });
    
    console.log('Outbound flights:', data.outbound.flights);
    console.log('Return flights:', data.return?.flights);
  } catch (error) {
    console.error('Search failed:', error.response.data);
  }
};
```

---

## Notes

### Lấy Airport ID

Để lấy `departure_airport_id` và `destination_airport_id`, bạn cần query từ bảng `airports`:

```bash
# Lấy danh sách sân bay
GET http://localhost:3000/airports

# Hoặc lấy theo IATA code
GET http://localhost:3000/airports?iata_code=SGN
```

### Quy định hành khách

- **Adults (Người lớn)**: ≥ 12 tuổi, phải có ít nhất 1 người
- **Children (Trẻ em)**: 2-11 tuổi, được giảm giá ~25%
- **Infants (Em bé)**: < 2 tuổi, được giảm giá ~90%, không có ghế riêng

### Tối ưu hóa

- ✅ Chỉ trả về chuyến bay còn ghế trống
- ✅ Giá được tính dựa trên fare bucket thấp nhất
- ✅ Hỗ trợ cả one-way và round-trip
- ✅ Tự động tính duration
- ✅ Hiển thị thông tin chi tiết sân bay, hãng bay, máy bay

### Response Fields Explained

| Field | Description |
|-------|-------------|
| `flight_id` | UUID của flight instance |
| `flight_number` | Mã chuyến bay (VD: VN100) |
| `airline.name` | Tên hãng bay |
| `airline.code` | Mã IATA của hãng bay |
| `departure.airport` | Thông tin đầy đủ sân bay đi |
| `departure.time` | Thời gian khởi hành dự kiến |
| `arrival.airport` | Thông tin đầy đủ sân bay đến |
| `arrival.time` | Thời gian đến dự kiến |
| `duration` | Thời gian bay (hours, minutes, formatted) |
| `status` | Trạng thái chuyến bay (SCHEDULED, DELAYED, ...) |
| `available_seats` | Tổng số ghế còn trống |
| `pricing.total_price` | Tổng giá cho TẤT CẢ hành khách |
| `pricing.breakdown` | Chi tiết giá cho từng loại hành khách |
| `fare_buckets` | Các hạng vé khả dụng (Economy, Business...) |

### Future Enhancements

- [ ] Thêm filter theo giá, thời gian, hãng bay
- [ ] Sort theo giá, thời gian, thời lượng
- [ ] Pagination cho kết quả nhiều
- [ ] Cache kết quả search
- [ ] Realtime availability updates
- [ ] Multi-city search

