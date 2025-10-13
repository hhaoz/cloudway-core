# Booking with Payment API Documentation

## Tổng quan

API tạo booking tự động tính giá và tạo payment record khi booking thành công.

---

## POST `/bookings/with-passengers`

### Request Body

```json
{
  "user_id": "f84aefb7-cc2a-4412-ac6b-b1cccba8104b",
  "contact_fullname": "Nguyễn Văn A",
  "contact_phone": "0901234567",
  "segments": [
    {
      "flight_instance_id": "2c28ef7b-d009-42c6-854c-7f0c6f8bace7",
      "fare_bucket_id": "fb123456-7890-abcd-ef12-345678901234",
      "passengers": [
        {
          "full_name": "Nguyễn Văn A",
          "date_of_birth": "1990-01-15",
          "id_number": "001234567890",
          "phone": "0901234567",
          "email": "nguyenvana@gmail.com",
          "passenger_type": "ADULT"
        },
        {
          "full_name": "Nguyễn Thị B",
          "date_of_birth": "2015-06-20",
          "passenger_type": "CHILD"
        }
      ]
    }
  ]
}
```

---

## Response

```json
{
  "message": "✅ Tạo booking thành công",
  "booking": {
    "id": "abc12345-6789-0123-4567-890abcdef123",
    "pnr_code": "AB12CD",
    "user_id": "f84aefb7-cc2a-4412-ac6b-b1cccba8104b",
    "contact_fullname": "Nguyễn Văn A",
    "contact_phone": "0901234567",
    "status": "HOLD",
    "created_at": "2025-10-09T10:30:00Z",
    "segments": [
      {
        "id": "seg12345...",
        "booking_id": "abc12345...",
        "flight_instance_id": "2c28ef7b...",
        "fare_bucket_id": "fb123456...",
        "price": 2700000,
        "passengers": [
          {
            "id": "pas12345...",
            "full_name": "Nguyễn Văn A",
            "passenger_type": "ADULT",
            "created_at": "2025-10-09T10:30:00Z"
          },
          {
            "id": "pas67890...",
            "full_name": "Nguyễn Thị B",
            "passenger_type": "CHILD",
            "created_at": "2025-10-09T10:30:00Z"
          }
        ]
      }
    ],
    "payment": {
      "id": "pay12345-6789-0123-4567-890abcdef123",
      "amount": 2700000,
      "currency": "VND",
      "status": "PENDING",
      "created_at": "2025-10-09T10:30:00Z"
    }
  }
}
```

---

## Luồng xử lý

### 1. Generate PNR Code
```
- Tạo mã 6 ký tự ngẫu nhiên (A-Z, 0-9)
- Kiểm tra unique trong database
- Retry tối đa 10 lần nếu trùng
```

### 2. Tạo Booking
```
- Status: HOLD (chờ thanh toán)
- Lưu thông tin người liên hệ
```

### 3. Tạo Segments & Passengers
```
For each segment:
  - Tạo booking_segment
  - Tính giá vé (calculateSegmentPrice)
  - Tạo passengers
  - Cộng dồn vào totalAmount
```

### 4. Tính Giá Vé

**Logic tính giá cho 1 segment:**

```typescript
// Group passengers by type
ADULT: 1 người
CHILD: 1 người
INFANT: 0 người

// Query fares table
For each passenger_type:
  SELECT base_price 
  FROM fares
  WHERE flight_instance_id = ...
    AND fare_bucket_id = ...
    AND passenger_type = ...

// Tính tổng
segment_price = 
  (adult_price × adults) + 
  (child_price × children) + 
  (infant_price × infants)

// Ví dụ:
adult_price = 2,000,000 VND × 1 = 2,000,000 VND
child_price = 1,500,000 VND × 1 = 1,500,000 VND
total = 3,500,000 VND
```

### 5. Tạo Payment
```json
{
  "booking_id": "...",
  "amount": 3500000,
  "currency": "VND",
  "payment_method": "PENDING",
  "status": "PENDING"
}
```

**Payment Status Flow:**
```
PENDING → PAID (thanh toán thành công)
        → FAILED (thanh toán thất bại)
```

### 6. Rollback on Error
```
Nếu bất kỳ bước nào fail:
  → DELETE booking
  → Throw error
  → Đảm bảo data integrity
```

---

## Lấy Thông Tin Booking

### GET `/bookings/:id`

Response bao gồm đầy đủ payments:

```json
{
  "id": "...",
  "pnr_code": "AB12CD",
  "status": "HOLD",
  "booking_segments": [...],
  "payments": [
    {
      "id": "...",
      "amount": 3500000,
      "currency": "VND",
      "payment_method": "PENDING",
      "status": "PENDING",
      "transaction_id": null,
      "paid_at": null,
      "created_at": "2025-10-09T10:30:00Z"
    }
  ]
}
```

### GET `/bookings/pnr/:pnrCode`

Tra cứu booking theo mã PNR, response giống GET by ID.

---

## Bảng Fares

Để tính giá chính xác, cần có dữ liệu trong bảng `fares`:

```sql
INSERT INTO fares (
  flight_instance_id,
  fare_bucket_id,
  passenger_type,
  base_price
) VALUES
  ('flight-id', 'economy-bucket-id', 'ADULT', 2000000),
  ('flight-id', 'economy-bucket-id', 'CHILD', 1500000),
  ('flight-id', 'economy-bucket-id', 'INFANT', 200000);
```

**Constraint unique:**
```
(flight_instance_id, fare_bucket_id, passenger_type)
```

Mỗi chuyến bay + hạng vé chỉ có 1 giá cho mỗi loại hành khách.

---

## Error Handling

### 400 - Không tìm thấy giá vé

```json
{
  "statusCode": 400,
  "message": "Không tìm thấy giá vé cho ADULT trên chuyến bay này"
}
```

**Nguyên nhân:**
- Chưa có record trong bảng `fares`
- Sai `fare_bucket_id`
- Sai `flight_instance_id`

**Giải pháp:**
- Tạo fare trước khi cho phép booking

### 400 - Lỗi tạo payment

```json
{
  "statusCode": 400,
  "message": "Lỗi tạo payment: ..."
}
```

**Giải pháp:**
- Kiểm tra constraint trong bảng payments
- Booking sẽ tự động rollback

---

## Ví dụ Full Flow

### 1. Tạo Flight & Fares

```sql
-- Tạo flight instance
INSERT INTO flight_instances (...) VALUES (...);

-- Tạo fares cho flight
INSERT INTO fares (
  flight_instance_id,
  fare_bucket_id,
  passenger_type,
  base_price
) VALUES
  ('flight-id', 'eco-bucket', 'ADULT', 1500000),
  ('flight-id', 'eco-bucket', 'CHILD', 1125000),
  ('flight-id', 'eco-bucket', 'INFANT', 150000);
```

### 2. Client Tạo Booking

```javascript
const response = await axios.post('/bookings/with-passengers', {
  contact_fullname: 'Nguyễn Văn A',
  contact_phone: '0901234567',
  segments: [
    {
      flight_instance_id: 'flight-id',
      fare_bucket_id: 'eco-bucket',
      passengers: [
        {
          full_name: 'Nguyễn Văn A',
          passenger_type: 'ADULT'
        }
      ]
    }
  ]
});

console.log('Total:', response.data.booking.payment.amount);
// Output: 1500000 VND
```

### 3. Payment Flow

```javascript
// 1. Lấy thông tin payment
const booking = response.data.booking;
const paymentAmount = booking.payment.amount;

// 2. Redirect đến payment gateway
redirectToPaymentGateway({
  amount: paymentAmount,
  booking_id: booking.id,
  pnr: booking.pnr_code
});

// 3. Sau khi thanh toán thành công, update payment
await axios.patch(`/payments/${booking.payment.id}`, {
  status: 'PAID',
  payment_method: 'CREDIT_CARD',
  transaction_id: 'TXN123456',
  paid_at: new Date()
});

// 4. Update booking status
await axios.patch(`/bookings/${booking.id}`, {
  status: 'CONFIRMED'
});
```

---

## Tính năng nổi bật

### ✅ Tự động tính giá
- Query từ bảng `fares`
- Tính theo từng loại hành khách
- Tổng giá chính xác 100%

### ✅ Multi-segment pricing
- Hỗ trợ nhiều chuyến bay
- Tổng giá = sum(segment prices)

### ✅ Payment tracking
- Tự động tạo payment record
- Status: PENDING → PAID/FAILED
- Lưu transaction_id

### ✅ Data integrity
- Rollback nếu có lỗi
- Foreign key constraints
- Unique constraints

### ✅ Flexible passenger info
- Required: full_name, passenger_type
- Optional: date_of_birth, id_number, phone, email

---

## Best Practices

1. **Tạo fares trước** khi cho phép booking
2. **Validate passenger count** với seat availability
3. **Set timeout** cho payment (VD: 15 phút)
4. **Send email** confirmation với PNR code
5. **Log transactions** cho audit trail

---

## Database Schema Summary

```
bookings (1) ──< booking_segments (N)
                 ├─> flight_instances (1)
                 ├─> fare_buckets (1)
                 └─< passengers (N)

bookings (1) ──< payments (N)

flight_instances + fare_buckets + passenger_type → fares (base_price)
```

---

## Next Steps

- [ ] Payment gateway integration (VNPay, MoMo, etc.)
- [ ] Email confirmation
- [ ] SMS notification
- [ ] Payment timeout handling
- [ ] Refund logic
- [ ] Loyalty points calculation

