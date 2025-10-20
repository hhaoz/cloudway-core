# Tích Hợp Thống Kê Airline với Flight Management

## Tổng Quan

Hệ thống đã được tích hợp để tự động cập nhật thống kê airline trong bảng `airline_statistics` khi có các hành động liên quan đến chuyến bay.

## Bảng airline_statistics

```sql
CREATE TABLE public.airline_statistics (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  airline_id uuid NOT NULL,
  total_flights integer NULL DEFAULT 0,
  total_passengers integer NULL DEFAULT 0,
  total_revenue numeric(12, 2) NULL DEFAULT 0,
  cancelled_flights integer NULL DEFAULT 0,
  on_time_flights integer NULL DEFAULT 0,
  created_at timestamp without time zone NULL DEFAULT now(),
  updated_at timestamp without time zone NULL DEFAULT now(),
  CONSTRAINT airline_statistics_pkey PRIMARY KEY (id),
  CONSTRAINT airline_statistics_airline_id_fkey FOREIGN KEY (airline_id) REFERENCES airlines (id) ON DELETE CASCADE
);
```

## Các Hành Động Tự Động Cập Nhật Thống Kê

### 1. Tạo Chuyến Bay Mới
**Endpoint:** `POST /flights`
**Hành động:** Tăng `total_flights` và `on_time_flights`

```typescript
// Trong createFlight method
await this.airlineStatisticService.updateStatisticsOnFlight(airline_id, true);
```

**Lưu ý:** Hiện tại tất cả chuyến bay mới tạo đều được coi là đúng giờ (on_time = true) vì chưa có logic kiểm tra delay.

### 2. Hủy Chuyến Bay
**Endpoint:** `PATCH /flights/:id/cancel`
**Hành động:** Tăng `cancelled_flights`

```typescript
// Trong cancelFlight method
await this.airlineStatisticService.updateStatisticsOnFlightCancellation(airlineId);
```

### 3. Cập Nhật Status Chuyến Bay
**Endpoint:** `PATCH /flights/:id/status`
**Hành động:** Cập nhật thống kê dựa trên status mới

```typescript
// Trong updateStatus method
await this.updateAirlineStatisticsOnStatusChange(id, updateStatusDto.status);
```

**Logic cập nhật:**
- `DEPARTED` hoặc `ARRIVED`: Tăng `total_flights` và `on_time_flights`
- `CANCELLED`: Tăng `cancelled_flights`
- `SCHEDULED`: Không cập nhật thống kê

## API Endpoints Mới

### Cập Nhật Status Chuyến Bay
```http
PATCH /flights/:id/status
Content-Type: application/json

{
  "status": "DEPARTED",
  "actual_departure_local": "2024-01-15T08:35:00Z",
  "actual_arrival_local": "2024-01-15T10:50:00Z"
}
```

**Response:**
```json
{
  "message": "Cập nhật status chuyến bay thành công",
  "data": {
    "id": "flight-instance-uuid",
    "status": "DEPARTED",
    "actual_departure_local": "2024-01-15T08:35:00Z",
    "actual_arrival_local": "2024-01-15T10:50:00Z",
    "updated_at": "2024-01-15T08:35:00Z"
  }
}
```

## AirlineStatisticService Methods

### 1. updateStatisticsOnFlight
```typescript
async updateStatisticsOnFlight(airlineId: string, isOnTime: boolean = true)
```
- Tăng `total_flights`
- Nếu `isOnTime = true`: tăng `on_time_flights`

### 2. updateStatisticsOnFlightCancellation
```typescript
async updateStatisticsOnFlightCancellation(airlineId: string)
```
- Tăng `cancelled_flights`

### 3. updateStatisticsOnBooking
```typescript
async updateStatisticsOnBooking(airlineId: string, passengerCount: number, revenue: number)
```
- Tăng `total_passengers`
- Tăng `total_revenue`

### 4. getAirlineStatistics
```typescript
async getAirlineStatistics(airlineId: string)
```
- Lấy thống kê hiện tại của airline

## Xử Lý Lỗi

Tất cả các cập nhật thống kê đều được wrap trong try-catch để đảm bảo không ảnh hưởng đến business logic chính:

```typescript
try {
  await this.airlineStatisticService.updateStatisticsOnFlight(airline_id, true);
} catch (statsError) {
  console.error('Lỗi cập nhật thống kê airline:', statsError);
  // Không throw error để không ảnh hưởng đến việc tạo chuyến bay
}
```

## Ví Dụ Sử Dụng

### 1. Tạo chuyến bay mới
```bash
POST /flights
{
  "airline_id": "airline-uuid",
  "flight_number": {
    "code": "VN123",
    "departure_airport_id": "airport-uuid-1",
    "arrival_airport_id": "airport-uuid-2"
  },
  "aircraft_id": "aircraft-uuid",
  "scheduled_departure_local": "2024-01-15T08:30:00Z",
  "scheduled_arrival_local": "2024-01-15T10:45:00Z",
  "fares": [...]
}
```
**Kết quả:** `total_flights` và `on_time_flights` tăng lên 1

### 2. Cập nhật chuyến bay thành DEPARTED
```bash
PATCH /flights/flight-uuid/status
{
  "status": "DEPARTED",
  "actual_departure_local": "2024-01-15T08:35:00Z"
}
```
**Kết quả:** `total_flights` và `on_time_flights` tăng lên 1

### 3. Hủy chuyến bay
```bash
PATCH /flights/flight-uuid/cancel
```
**Kết quả:** `cancelled_flights` tăng lên 1

## Lưu Ý Quan Trọng

1. **Tính nhất quán:** Tất cả cập nhật thống kê đều được thực hiện trong transaction với business logic chính
2. **Xử lý lỗi:** Lỗi cập nhật thống kê không ảnh hưởng đến việc thực hiện hành động chính
3. **Performance:** Các cập nhật thống kê được thực hiện bất đồng bộ để không làm chậm response
4. **Mở rộng:** Có thể dễ dàng thêm logic kiểm tra delay trong tương lai để cập nhật chính xác `on_time_flights`

## Tương Lai

- Thêm logic kiểm tra delay để cập nhật chính xác `on_time_flights`
- Thêm thống kê về thời gian delay trung bình
- Thêm dashboard để hiển thị thống kê real-time
