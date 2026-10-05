# SnapShare – Scaling Plan

## 1. Assumptions and Daily Active Users

**Assumptions:**
- 10 million registered users
- 10% are active daily
- Each active user uploads 1 photo per day
- Each active user views 50 feed pages per day
- Average photo size: 2 MB
- Average thumbnail size: 50 KB

**Daily active users (DAU):**
10,000,000 × 10% = **1,000,000 DAU**

---

## 2. Traffic and Storage Estimates

| Metric | Average | Peak (× 5) |
|--------|---------|-----------|
| Uploads per second | ~12 | ~60 |
| Feed views per second | ~579 | ~2,900 |

**Storage per year:**
- 365 million photos/year × 2 MB = ~730 TB
- 365 million thumbnails/year × 50 KB = ~18 TB
- **Total: ~748 TB per year**

---

## 3. Read-Heavy or Write-Heavy

This system is **read-heavy**. There are ~50 million feed views per day versus ~1 million uploads per day — a **50:1 read-to-write ratio**.

**What this means for design:**
- Add **caching** to serve feeds quickly
- Use **database read replicas** to spread read load
- Serve photos from a **CDN** so the app servers aren't hit for every image
- Writes (uploads) can be queued and processed asynchronously

---

## 4. Why Photos Should Not Be Stored in the Database

Storing 2 MB image files in a relational database would:
- Bloat the database and make backups huge
- Slow down queries (rows become enormous)
- Cost far more than object storage
- Make replication expensive

**Photos should be stored in object storage** (like Amazon S3 or Cloudflare R2), and the database should only store **metadata** (file path, owner, upload time, etc.).

---

## 5. Architecture Diagram (Text)
[ Users ]
│
▼
[ CDN ] ◄──── Serves photos and thumbnails
│
▼
[ Load Balancer ]
│
▼
[ App Servers (×N) ]
│           │
▼           ▼
[ Cache ]   [ Database + Read Replica ]
│
▼
[ Object Storage ] ◄── Photos + Thumbnails
▲
│
[ Worker ] ◄── [ Queue ] ◄── Upload event
---

## 6. Component Explanations

- **CDN:** Serves photos and thumbnails from locations close to users, reducing latency.
- **Load Balancer:** Distributes incoming traffic across multiple app servers.
- **App Servers:** Run the business logic — authentication, feeds, uploads, and API requests.
- **Cache:** Stores hot data (feed IDs, user sessions) in memory for fast access.
- **Database (with read replica):** Stores metadata (users, photos, follows); the replica handles read queries.
- **Object Storage:** Stores the actual photo files and thumbnails.
- **Queue:** Holds thumbnail-generation jobs so uploads stay fast.
- **Worker:** Reads jobs from the queue and creates thumbnails.

---

## 7. Upload Flow (Step by Step)

1. User selects a photo and taps Upload.
2. App server receives the request and generates a **pre-signed URL** for object storage.
3. Client uploads the photo directly to **object storage** using the pre-signed URL.
4. App server writes **metadata** (owner, path, timestamp) into the database.
5. App server pushes a **thumbnail job** onto the **queue**.
6. A **worker** picks up the job, downloads the photo, and creates a thumbnail.
7. The worker uploads the thumbnail to object storage.
8. The worker updates the database with the thumbnail path.
9. The user's feed now shows the thumbnail served from the CDN.

---

## 8. Trade-offs

**Trade-off 1: Strong consistency vs availability**
- Chose **eventual consistency** for feeds. A new post may take a few seconds to appear for followers. This lets us scale reads with replicas and caching without slowing down writes.

**Trade-off 2: Cost vs latency for storage**
- Chose **object storage + CDN** over keeping images in the database. This is cheaper and faster for reads, but adds an extra dependency (CDN) and makes it harder to serve a photo if the CDN is down.

**Trade-off 3: Async thumbnails vs synchronous**
- Chose **async processing** with a queue and worker. Uploads return faster, but the thumbnail is not instantly available — the feed may briefly show a placeholder.

---

## 9. Summary

SnapShare is a **read-heavy** system with ~1M DAU, ~12 uploads/sec, and ~579 feed views/sec. Photos live in **object storage**, metadata lives in a **relational database with a read replica**, and a **CDN + cache** handle the heavy read load. The upload flow uses a **queue + worker** to generate thumbnails asynchronously.