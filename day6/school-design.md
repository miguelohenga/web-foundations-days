# School Database Design

## Tables

### `students`

Stores each student's name and unique email.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| name | TEXT | Not null |
| email | TEXT | Not null, unique |

### `courses`

Stores each course's title.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| title | TEXT | Not null |

### `enrollments`

Links a student to a course and holds the grade.

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary key |
| student_id | INTEGER | Foreign key to students.id |
| course_id | INTEGER | Foreign key to courses.id |
| grade | INTEGER | Nullable (until graded) |

A `UNIQUE (student_id, course_id)` constraint prevents the same student enrolling in the same course twice.

---

## Relationships

- **students → enrollments:** one-to-many. One student can have many enrollments.
- **courses → enrollments:** one-to-many. One course can have many enrollments.
- **students ↔ courses:** many-to-many. A student can take many courses, and a course can have many students.

The `enrollments` table is the **join table** that connects students and courses. It's needed because a many-to-many relationship can't be stored directly in a relational database.

---

## Index

I would add an index on `enrollments.course_id` because most queries filter or group by course (e.g. "list all students on a course" and "count students per course"). This index speeds up those lookups.

```sql
CREATE INDEX idx_enrollments_course ON enrollments(course_id);