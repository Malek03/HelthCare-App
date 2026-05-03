# المخططات الهيكلية لمنصة الرعاية الصحية (HealthCare Platform Diagrams)

هذا الملف يحتوي على المخططات الهندسية الدقيقة لمشروعك، مبنية على بنية قاعدة البيانات `schema.prisma` وباستخدام المصادقة التقليدية (البريد الإلكتروني وكلمة المرور) وبدون استخدام التخزين المؤقت الإضافي.

---

## 1. مخطط الكيانات والعلاقات (ERD - Entity Relationship Diagram)

```mermaid
erDiagram
    USER ||--o| DOCTOR_PROFILE : "يمتلك (1:1)"
    USER ||--o| DOCTOR_APPLICATION : "يقدم طلب طبيب (1:1)"
    USER ||--o{ APPOINTMENT : "يحجز كمريض (1:N)"
    USER ||--o{ CONSULTATION : "يطلب استشارة (1:N)"
    USER ||--o{ WATER_LOG : "يسجل بيانات (1:N)"
    USER ||--o{ SLEEP_LOG : "يسجل بيانات (1:N)"
    USER ||--o{ WALK_LOG : "يسجل بيانات (1:N)"
    USER ||--o{ NOTIFICATION : "يتلقى إشعارات (1:N)"
    
    DOCTOR_PROFILE ||--o{ WORK_SCHEDULE : "يمتلك أوقات عمل (1:N)"
    DOCTOR_PROFILE ||--o{ APPOINTMENT : "يدير مواعيد (1:N)"
    DOCTOR_PROFILE ||--o{ CONSULTATION : "يجيب على استشارة (1:N)"
    DOCTOR_PROFILE ||--o{ ARTICLE : "ينشر مقالات (1:N)"

    USER {
        String id PK
        String email
        String password
        String role "USER, DOCTOR, ADMIN"
    }
    DOCTOR_PROFILE {
        String id PK
        String specialty
        Int experience_years
        Boolean is_active
    }
    APPOINTMENT {
        String id PK
        DateTime date_time
        String status "PENDING, ACCEPTED, REJECTED, COMPLETED"
    }
    CONSULTATION {
        String id PK
        String status "PENDING, ANSWERED"
    }
```

---

## 2. المخطط البيئي / المعماري (Environmental Diagram)
يوضح المعمارية الفعلية للمشروع المكونة من الخدمات المصغرة واعتمادها المباشر على PostgreSQL.

```mermaid
graph TD
    Client[تطبيق الويب/الهاتف - PWA] -->|HTTPS Requests| Gateway[API Gateway / Load Balancer]
    
    subgraph Microservices [الخدمات المصغرة]
        Gateway --> AuthSvc[خدمة المصادقة - Auth Service]
        Gateway --> BusinessSvc[خدمة الأعمال والعيادات - Business Service]
        Gateway --> WebSvc[خدمة المرضى - Web Service]
    end

    subgraph Persistence [التخزين وقاعدة البيانات]
        AuthSvc --> DB[(PostgreSQL Database)]
        BusinessSvc --> DB
        WebSvc --> DB
    end

    subgraph External [الخدمات السحابية]
        BusinessSvc --> Cloudinary[Cloudinary للصور والوثائق]
        WebSvc --> Cloudinary
    end
```

---

## 3. مخططات العمليات (Process / Activity Diagrams)

### العملية الأولى: تسجيل واعتماد طبيب جديد (Doctor Application Flow)
```mermaid
flowchart TD
    Start([بدء التسجيل]) --> SubmitForm[الطبيب يرسل طلب الانضمام والوثائق]
    SubmitForm --> SavePending[حفظ الطلب في قاعدة البيانات بحالة PENDING]
    SavePending --> NotifyAdmin[إرسال إشعار للإدارة بوجود طلب جديد]
    NotifyAdmin --> AdminReview{مراجع الإدارة للطلب}
    
    AdminReview -->|موافقة| ApproveAction[تحديث الطلب لـ APPROVED]
    ApproveAction --> CreateProfile[إنشاء DoctorProfile آلياً]
    CreateProfile --> NotifyDocAccept[إشعار الطبيب بتفعيل حسابه]
    
    AdminReview -->|رفض| RejectAction[تحديث الطلب لـ REJECTED]
    RejectAction --> AddNotes[إضافة أسباب الرفض]
    AddNotes --> NotifyDocReject[إشعار الطبيب بالرفض مع الأسباب]
    
    NotifyDocAccept --> End([النهاية])
    NotifyDocReject --> End
```

### العملية الثانية: حجز وإدارة موعد طبي (Appointment Booking Flow)
```mermaid
flowchart TD
    Start([البدء]) --> SearchDoc[المريض يبحث عن طبيب حسب التخصص]
    SearchDoc --> ViewSchedule[استعراض أوقات العمل المتاحة للطبيب]
    ViewSchedule --> SelectSlot[المريض يختار الوقت المناسب]
    SelectSlot --> SaveAppt[حفظ الحجز بحالة PENDING]
    SaveAppt --> NotifyDoctor[إرسال إشعار للطبيب بطلب موعد]
    
    NotifyDoctor --> DoctorDecision{قرار الطبيب}
    
    DoctorDecision -->|قبول| AcceptAppt[تغيير الحالة إلى ACCEPTED]
    AcceptAppt --> NotifyPatientAcc[إشعار المريض بالتأكيد]
    
    DoctorDecision -->|رفض| RejectAppt[تغيير الحالة إلى REJECTED]
    RejectAppt --> NotifyPatientRej[إشعار المريض بالرفض لسبب معين]
    
    DoctorDecision -->|تم الانتهاء| CompleteAppt[تغيير الحالة إلى COMPLETED بعد الزيارة]
    
    NotifyPatientAcc --> End([النهاية])
    NotifyPatientRej --> End
    CompleteAppt --> End
```

### العملية الثالثة: طلب استشارة طبية (Consultation Flow)
```mermaid
flowchart TD
    Start([البدء]) --> SubmitQuestion[المريض يرسل سؤال للطبيب]
    SubmitQuestion --> SaveCons[حفظ الاستشارة بحالة PENDING]
    SaveCons --> NotifyDoc[إشعار الطبيب بوجود سؤال جديد]
    NotifyDoc --> DoctorAnswers[الطبيب يكتب الإجابة]
    DoctorAnswers --> UpdateCons[تحديث الاستشارة بحالة ANSWERED]
    UpdateCons --> NotifyPat[إشعار المريض بتوفر الإجابة]
    NotifyPat --> End([النهاية])
```

---

## 4. مخططات التتابع (Sequence Diagrams)

### مخطط التتابع 1: تسجيل الدخول (Email & Password Authentication)
```mermaid
sequenceDiagram
    actor U as المستخدم (مريض/طبيب)
    participant App as تطبيق PWA
    participant Auth as خدمة المصادقة (Auth API)
    participant DB as قاعدة البيانات (PostgreSQL)

    U->>App: إدخال البريد الإلكتروني وكلمة المرور
    App->>Auth: إرسال طلب تسجيل الدخول (Login)
    Auth->>DB: البحث عن المستخدم بالبريد الإلكتروني
    
    alt المستخدم موجود
        DB-->>Auth: إرجاع بيانات المستخدم (بما فيها كلمة المرور المشفرة)
        Auth->>Auth: مطابقة كلمة المرور المدخلة مع المشفرة (Hash Compare)
        
        alt كلمة المرور صحيحة
            Auth->>DB: تحديث بيانات الجلسة (إن لزم الأمر)
            Auth-->>App: إرجاع رمز التوثيق (JWT Token)
            App-->>U: الدخول بنجاح وتوجيه للوحة التحكم
        else كلمة المرور خاطئة
            Auth-->>App: إرجاع خطأ (Unauthorized)
            App-->>U: إظهار رسالة "كلمة المرور غير صحيحة"
        end
    else المستخدم غير موجود
        Auth-->>App: إرجاع خطأ (Not Found)
        App-->>U: إظهار رسالة "المستخدم غير مسجل"
    end
```

### مخطط التتابع 2: تتبع الحالة الصحية (Health Tracking - Water/Sleep)
```mermaid
sequenceDiagram
    actor P as المريض
    participant App as تطبيق PWA
    participant WebAPI as خدمة الويب (Web API)
    participant DB as قاعدة البيانات

    P->>App: تسجيل أكواب الماء أو ساعات النوم
    App->>WebAPI: إرسال البيانات (مثال: WaterLog / SleepLog)
    WebAPI->>DB: التحقق من عدم وجود سجل لنفس اليوم (Unique Constraint)
    
    alt لا يوجد سجل لهذا اليوم
        WebAPI->>DB: إنشاء سجل جديد بالبيانات
        DB-->>WebAPI: تأكيد الإنشاء
        WebAPI-->>App: رسالة نجاح
    else يوجد سجل مسبقاً
        WebAPI->>DB: تحديث السجل الحالي (إضافة أكواب إضافية)
        DB-->>WebAPI: تأكيد التحديث
        WebAPI-->>App: رسالة نجاح التحديث
    end
    App-->>P: تحديث الواجهة والرسوم البيانية
```
