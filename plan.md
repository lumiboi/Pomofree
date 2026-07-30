# Pomofree Geliştirme Planı

## Bu plan tek fazda tamamlanacaktır!

## 1. Ürün Vizyonu

Pomofree yalnızca süre tutan bir Pomodoro uygulaması değil; kullanıcının:

- işe başlamasını kolaylaştıran,
- odak sürecini koruyan,
- dikkat dağılmalarını görünür hâle getiren,
- çalışma alışkanlıklarını analiz eden,
- zaman tahminlerini geliştiren,
- gerektiğinde başkalarıyla birlikte çalışmasını sağlayan

bir odak ve üretkenlik sistemi olmalıdır.

Ana ürün döngüsü:

```text
Proje seç
→ Görev seç
→ Seans hedefini belirle
→ Odaklan
→ Kesintileri kaydet
→ Seansı değerlendir
→ Sonuçları analiz et
```

---

## 2. Öncelik Sırası

### P0 — Temel ürün kalitesi

Bunlar tamamlanmadan yeni ve gösterişli özelliklere geçilmemelidir.

- Kuş sesi süresi fazla uzun, biraz kısaltılsın
- Music Player sürükleme kısmı smooth değil mouse ile senkron hissettirmiyor sanki gecikmeli gibi
- Sayaç yenileme ve sekme kapanmalarında kaybolmamalı
- Bilgisayar uykuya girip çıktığında süre doğru hesaplanmalı
- Aktif görev ve aktif seans saklanmalı
- Masaüstü bildirimleri çalışmalı
- Sekme başlığında kalan süre görünmeli
- Mobil ve masaüstü yerleşimleri taşmamalı
- Klavye kısayolları eklenmeli
- Veriler dışa aktarılabilmeli
- Temel erişilebilirlik seçenekleri bulunmalı

### P1 — Ana çalışma döngüsü

Pomofree'nin gerçekten faydalı olmasını sağlayacak özellikler.

- Görev süresi tahmini
- Seans bitiş kriteri
- Dikkat dağıtıcı not kutusu
- Seans sonu değerlendirme
- Kesinti günlüğü
- Acil başlama modu
- Akıllı mola sistemi

### P2 — Ürünü farklılaştıran özellikler

- Adaptif Pomodoro
- Benimle Çalış / body doubling
- Gelişmiş davranış raporları
- Proje bitiş tahmini
- Odak ses mikseri
- Haftalık akıllı değerlendirme

### P3 — Sonraki aşama

- Gelişmiş gamification
- Sosyal başarı sistemleri
- Derin kişiselleştirme
- Yoğun görsel efektler
- Three.js tabanlı dekoratif deneyimler

---

# 3. Özellik Planı

## 3.1 Görev Süresi Tahmini

### Amaç

Kullanıcının bir görevin kaç Pomodoro süreceğini tahmin etmesini ve zamanla kendi tahmin doğruluğunu geliştirmesini sağlamak.

### Kullanıcı akışı

Görev oluşturulurken veya düzenlenirken kullanıcı tahmini Pomodoro sayısını girer.

Örnek:

```text
Görev: Login ekranını responsive yap
Tahmin: 3 Pomodoro
Harcanan: 2 Pomodoro
Kalan: yaklaşık 1 Pomodoro
```

### Arayüz

Her görevde şu bilgiler gösterilir:

- Tahmini Pomodoro
- Tamamlanan Pomodoro
- Tahmini kalan süre
- Tahmin doğruluğu

### Raporlar

- Planlanan / gerçekleşen Pomodoro oranı
- En çok yanlış tahmin edilen görev türleri
- Proje bazında tahmin doğruluğu
- Son dört haftadaki tahmin gelişimi

### Kabul kriterleri

- Kullanıcı görev oluştururken tahmin girebilir
- Tahmin sonradan düzenlenebilir
- Tamamlanan her seans göreve otomatik eklenir
- Görev tamamlandığında gerçek süre kaydedilir
- Raporlarda tahmin ile gerçek süre karşılaştırılır

---

## 3.2 Seans Bitiş Kriteri

### Amaç

Kullanıcının yalnızca süre geçirmek yerine her seansa somut bir çıktı hedefiyle başlamasını sağlamak.

### Kullanıcı akışı

Başlat butonuna basıldığında kısa bir alan açılır:

> Bu seans sonunda ne tamamlanmış olacak?

Örnek:

```text
Login ekranının mobil responsive düzeni tamamlanacak.
```

Seans sonunda kullanıcı sonucu seçer:

- Tamamlandı
- Kısmen tamamlandı
- Tamamlanmadı
- Dikkatim dağıldı

İsteğe bağlı kısa not ekleyebilir.

### Kabul kriterleri

- Bitiş kriteri zorunlu veya ayarlardan isteğe bağlı yapılabilir
- Seans sonunda sonuç seçilebilir
- Sonuç aktif görevle ilişkilendirilir
- Raporlarda başarılı seans oranı gösterilir

---

## 3.3 Dikkat Dağıtıcı Not Kutusu

### Geçici isimler

- Aklıma Geldi
- Sonra Bak
- Düşünce Parkı

### Amaç

Kullanıcının çalışma sırasında aklına gelen şeyleri unutmadan kaydetmesini, fakat mevcut seansı bölmemesini sağlamak.

### Kullanıcı akışı

Seans sırasında tek tıklama veya klavye kısayoluyla küçük bir giriş alanı açılır.

Örnek notlar:

- Mail at
- Marketten süt al
- Şu videoya bak
- Header bug'ını düzelt
- Yeni proje fikrini kaydet

Seans sonunda notlar topluca gösterilir.

Kullanıcı notu:

- Göreve dönüştürebilir
- Daha sonra listesine taşıyabilir
- Silebilir
- Tamamlandı olarak işaretleyebilir

### Kabul kriterleri

- Sayaç durmadan not eklenebilir
- Notlar aktif seansla ilişkilendirilir
- Seans sonunda otomatik gösterilir
- Not görev hâline dönüştürülebilir
- `D` kısayolu ile açılabilir

---

## 3.4 Seans Sonu Değerlendirme

### Amaç

Kullanıcının hangi koşullarda daha verimli çalıştığını anlamasını sağlamak.

### Sorular

Her seans sonunda tek tıklamalık üç değerlendirme:

#### Odak

- Düşük
- Normal
- Yüksek

#### Zorluk

- Kolay
- Normal
- Zor

#### Enerji

- Düşük
- Normal
- Yüksek

Değerlendirme isteğe bağlı kısa not içerebilir.

### Rapor örnekleri

- En verimli saatlerin 10.00–12.00 arası
- Tasarım görevlerinde 40 dakikalık seanslar daha başarılı
- Üçüncü Pomodoro sonrasında odak puanın düşüyor
- Düşük enerjili seanslarda tamamlama oranın %28 azalıyor

### Kabul kriterleri

- Değerlendirme 10 saniyeden kısa sürede tamamlanabilir
- Atla seçeneği bulunur
- Veriler saat, proje, görev ve seans süresiyle ilişkilendirilir
- Rapor ekranında eğilimler gösterilir

---

## 3.5 Kesinti Günlüğü

### Amaç

Kullanıcının yalnızca ne kadar çalıştığını değil, odağının neden bozulduğunu da görebilmesini sağlamak.

### Kesinti türleri

- Telefon
- Bildirim
- İnsan
- Tuvalet / su
- İşle ilgili başka görev
- İçsel dikkat dağılması
- Teknik sorun
- Diğer

### Kullanıcı akışı

Seans sırasında `Kesildim` butonuna basılır.

Kullanıcı:

1. Kesinti sebebini seçer
2. İsteğe bağlı not ekler
3. Seansa geri döner

Sayaç ayara bağlı olarak:

- çalışmaya devam eder,
- otomatik durur,
- kullanıcıya seçim sunar.

### Rapor örnekleri

```text
Bu hafta 17 kesintinin 9'u telefondan kaynaklandı.
En çok kesildiğin saat aralığı 14.00–16.00.
Bildirim kaynaklı kesintiler geçen haftaya göre %35 azaldı.
```

### Kabul kriterleri

- Kesinti iki tıklamadan fazla sürmemeli
- Kesintiler aktif seansla ilişkilendirilmeli
- Raporlarda sebep ve saat dağılımı gösterilmeli
- Kullanıcı kendi kesinti türünü oluşturabilmeli

---

## 3.6 Acil Başlama Modu

### Amaç

Çalışmaya başlamakta zorlanan kullanıcı için 25 dakikalık başlangıç bariyerini azaltmak.

### Kullanıcı akışı

Ana ekranda alternatif bir seçenek:

> Sadece 5 dakika başla

Beş dakika sonunda:

- 10 dakika daha devam et
- Normal Pomodoro'ya geç
- Burada bitir

### Kurallar

- Bu seanslar raporlarda ayrı bir tür olarak tutulur
- Normal Pomodoro'ya dönüşürse toplam süre korunur
- Kullanıcı isterse varsayılan başlangıç süresini 3–10 dakika arasında ayarlayabilir

### Kabul kriterleri

- Tek tıkla başlatılabilir
- Süre sonunda net devam seçenekleri gösterilir
- Kullanıcıyı suçlayıcı veya baskılayıcı dil kullanılmaz
- Tamamlanan kısa seanslar da istatistiklere dâhil edilir

---

## 3.7 Adaptif Pomodoro

### Amaç

Pomodoro süresini kullanıcının gerçek çalışma alışkanlıklarına göre önermek.

### Örnek öneriler

```text
Son sekiz seansta odağın ortalama 19. dakikada düşmüş.
Bugünkü ilk seansı 20 dakika yapmak ister misin?
```

```text
Son üç seansı rahat tamamladın.
Bir sonraki seansı 35 dakikaya uzatabilirsin.
```

### Kurallar

- Uygulama süreyi habersiz değiştirmemeli
- Yalnızca öneri sunmalı
- Kullanıcı önerileri kapatabilmeli
- En az 10–15 seans verisi olmadan güçlü öneri verilmemeli
- Proje ve görev türlerine göre farklı süreler önerilebilmeli

### Kullanılabilecek veriler

- Seans tamamlama oranı
- Kesinti zamanı
- Odak değerlendirmesi
- Günün saati
- Seans sırası
- Görev türü
- Enerji seviyesi
- Geçmiş seans süresi

### Kabul kriterleri

- Önerinin neden verildiği açıklanır
- Kullanıcı öneriyi kabul veya reddedebilir
- Kabul edilen önerilerin sonucu takip edilir
- Öneriler rahatsız edici sıklıkta gösterilmez

---

## 3.8 Akıllı Mola Sistemi

### Amaç

Molaları rastgele motivasyon sözleri yerine gerçek fiziksel ve zihinsel toparlanma süresine çevirmek.

### Mola önerileri

- 20 saniye uzağa bak
- Su iç
- Omuzlarını hareket ettir
- Masadan kalk
- Bir sonraki seansın görevini belirle
- Ekrandan uzaklaş
- Kısa nefes egzersizi yap

### Bağlama göre öneri

- Uzun süre oturulduysa hareket öner
- Geceyse göz dinlendirme öner
- Art arda çok seans yapıldıysa uzun mola öner
- Düşük enerji seçildiyse hafif hareket öner
- Sonraki görev belirsizse görev seçme önerisi göster

### Kabul kriterleri

- Aynı öneri art arda gösterilmez
- Kullanıcı öneri kategorilerini kapatabilir
- Molanın bitmesine yakın dönüş bildirimi gönderilir
- Mola ekranı dikkat dağıtıcı içerikle dolmaz

---

## 3.9 Benimle Çalış — Body Doubling

### Amaç

Kullanıcının başka insanlarla aynı anda çalışarak başlama ve devam etme motivasyonunu artırmak.

### Oda türleri

#### Özel oda

- Davet bağlantısı veya kod
- Arkadaşlarla ortak sayaç
- Katılımcı durumları
- İsteğe bağlı mola sohbeti

#### Anonim oda

- Rastgele eşleşme veya açık çalışma odaları
- Kamera ve mikrofon zorunlu değil
- Yalnızca görev özeti ve durum bilgisi görünür

### Kullanıcı durumları

- Hazırlanıyor
- Odakta
- Molada
- Ayrıldı

### Çalışma kuralları

- Çalışma sırasında sohbet kapalı veya sınırlı
- Molada kısa mesajlaşma açılabilir
- Katılımcılar birbirinin ayrıntılı görev içeriğini paylaşmak zorunda değildir
- Kamera ve mikrofon varsayılan olarak kapalıdır

### Oda ekranı

```text
Mert — Login ekranı — Odakta
Ayşe — Sunum taslağı — Odakta
Can — Makale okuma — Molada
```

### Kabul kriterleri

- Oda oluşturulabilir ve bağlantıyla paylaşılabilir
- Sayaçlar senkronize çalışır
- Katılımcı bağlantısı koparsa yeniden katılabilir
- Kullanıcı odadan kolayca ayrılabilir
- Raporlarda sosyal seanslar ayrı görülebilir
- Gizlilik kontrolleri açık ve anlaşılır olmalıdır

---

## 3.10 Proje Yönetimi

### Proje alanları

- Proje adı
- Açıklama
- Hedef Pomodoro sayısı
- Son tarih
- Günlük hedef
- Öncelik
- Durum
- Proje rengi veya simgesi

### Proje kartında gösterilecekler

- Tamamlanma yüzdesi
- Harcanan toplam süre
- Tahmini kalan Pomodoro
- Son çalışma tarihi
- Son tarih riski
- Sonraki önerilen görev

### Bitiş tahmini

Örnek:

```text
Bu çalışma temposuyla proje 4 Ağustos'ta tamamlanacak.
Mevcut tahmin son tarihten iki gün geç.
```

### Unutulma riski

Uzun süredir çalışılmayan aktif projeler için:

```text
Bu projede dokuz gündür seans başlatmadın.
Devam etmek, ertelemek veya arşivlemek ister misin?
```

### Kabul kriterleri

- Proje hedefi ve son tarihi belirlenebilir
- Görevler projeler arasında taşınabilir
- Tamamlanma tahmini otomatik hesaplanır
- Pasif projeler için nazik hatırlatma gösterilir
- Projeler arşivlenebilir

---

## 3.11 Gelişmiş Raporlar

### Temel metrikler

- Toplam odak süresi
- Başarılı seans oranı
- Tamamlanan görev sayısı
- Planlanan / gerçekleşen Pomodoro
- Proje bazında süre
- Saat bazında verimlilik
- Kesinti dağılımı
- Seans sonu odak puanı
- Ortalama seans süresi
- Yarım bırakılan seanslar
- Seans sırasına göre performans

### Faydalı analizler

- Günün en verimli saati
- En çok yarım bırakılan görev türü
- Ortalama kaçıncı seansta yorulunduğu
- Hangi sürelerde daha başarılı olunduğu
- En çok kesintiye yol açan sebep
- Gece ve gündüz performans farkı
- Sosyal ve bireysel seans karşılaştırması

### Haftalık özet örneği

```text
Bu hafta toplam çalışma süren arttı; ancak başarılı seans oranın
%74'ten %58'e düştü. Özellikle gece yaptığın 40 dakikalık seanslar
yarım kaldı. Gelecek hafta gece seanslarını 25 dakika tutmak daha
uygun olabilir.
```

### Tasarım ilkesi

Raporlar yalnızca grafik göstermemeli. Her grafik şu sorulardan en az birini cevaplamalı:

- Ne oldu?
- Neden olmuş olabilir?
- Kullanıcı neyi değiştirebilir?

### Kabul kriterleri

- Tüm grafikler mobilde okunabilir olmalı
- Filtreler: tarih, proje, görev ve seans türü
- Kullanıcı verisini CSV ve JSON olarak dışa aktarabilmeli
- Yorumların hangi verilere dayandığı gösterilmeli
- Yetersiz veri varsa kesin yargılar üretilmemeli

---

## 3.12 Odak Ses Mikseri

### Amaç

Mevcut müzik çaları çalışma akışına entegre edilmiş bir odak ses sistemine dönüştürmek.

### Ses seçenekleri

- Yağmur
- Kafe
- Klavye
- Tren
- Şömine
- Brown noise
- White noise
- Doğa
- Kullanıcının müzik bağlantısı

### Özellikler

- Birden fazla sesi karıştırma
- Her ses için ayrı ses seviyesi
- Proje bazlı ses profili
- Pomodoro başlayınca yavaşça açılma
- Mola başlayınca otomatik azalması
- Son kullanılan profilin kaydedilmesi

### Kabul kriterleri

- Ses oynatımı sayacı etkilememeli
- Ses profilleri kaydedilebilmeli
- Kullanıcı tek tıkla tüm sesleri kapatabilmeli
- Mobil tarayıcı kısıtlamaları doğru yönetilmeli

---

# 4. Teknik Gereksinimler

## 4.1 Güvenilir Sayaç

Sayaç yalnızca `setInterval` değerine güvenmemelidir.

Kaydedilecek temel alanlar:

```ts
type ActiveSession = {
  id: string;
  startedAt: string;
  plannedDurationSeconds: number;
  pausedAt?: string;
  totalPausedSeconds: number;
  status: "running" | "paused" | "completed" | "cancelled";
  taskId?: string;
  projectId?: string;
};
```

Kalan süre gerçek zaman farkından hesaplanmalıdır:

```text
kalan süre =
planlanan süre
- (şimdiki zaman - başlangıç zamanı)
+ toplam duraklatılan süre
```

### Gereksinimler

- Sayfa yenilense de seans korunur
- Sekme arka planda olsa da süre sapmaz
- Bilgisayar uykuya girse de dönüşte doğru süre gösterilir
- Aynı kullanıcı farklı sekmeler açarsa çakışma engellenir

---

## 4.2 Veri Modeli

### Ana varlıklar

- User
- Project
- Task
- FocusSession
- SessionReview
- Interruption
- DistractionNote
- SoundProfile
- SharedRoom
- RoomParticipant

### Örnek seans modeli

```ts
type FocusSession = {
  id: string;
  userId: string;
  projectId?: string;
  taskId?: string;
  type: "pomodoro" | "short-start" | "custom" | "shared";
  plannedDurationSeconds: number;
  actualDurationSeconds: number;
  completionStatus:
    | "completed"
    | "partially-completed"
    | "not-completed"
    | "distracted";
  completionCriterion?: string;
  startedAt: string;
  endedAt?: string;
};
```

---

## 4.3 Veri Güvenliği ve Gizlilik

- Kullanıcı verileri açıkça izin verilmeden paylaşılmamalı
- Body doubling odalarında görev içeriği gizlenebilmeli
- Kamera ve mikrofon varsayılan olarak kapalı olmalı
- Hesap silme ve veri dışa aktarma seçenekleri bulunmalı
- Yerel kullanım modu değerlendirilmeli
- Analitik veriler anonimleştirilmeli

---

## 4.4 Çevrimdışı ve PWA

- Temel sayaç çevrimdışı çalışmalı
- Aktif seans yerel olarak saklanmalı
- Bağlantı geldiğinde veriler senkronize edilmeli
- Uygulama masaüstüne ve mobil ana ekrana kurulabilmeli
- Güncelleme sırasında aktif seans kaybolmamalı

---

## 4.5 Bildirimler

- Seans bitti
- Mola bitti
- Uzun mola zamanı
- Ortak çalışma odası başladı
- Davet edilen kullanıcı odaya katıldı

Kullanıcı her bildirim türünü ayrı ayrı kapatabilmelidir.

---

# 5. Kullanıcı Deneyimi İlkeleri

## 5.1 Hız

Sık kullanılan işlemler mümkün olduğunca az adım gerektirmelidir.

- Görev seç ve başlat: en fazla iki tıklama
- Dikkat dağıtıcı not ekleme: tek kısayol
- Kesinti kaydetme: en fazla iki tıklama
- Seans değerlendirme: yaklaşık 5–10 saniye

## 5.2 Suçlayıcı olmayan dil

Kaçınılacak ifadeler:

- Başarısız oldun
- Seriyi bozdun
- Yeterince çalışmadın
- Hedefini yine kaçırdın

Tercih edilecek ifadeler:

- Bu seans planlandığı gibi tamamlanmadı
- Daha kısa bir seans denemek ister misin?
- Odağın bugün daha erken düşmüş görünüyor
- Görevi daha küçük bir parçaya ayırabilirsin

## 5.3 Görsel yoğunluk

Neon görünüm korunabilir; fakat:

- Birincil eylem her zaman net olmalı
- Parlama metnin okunabilirliğini bozmamalı
- Hareketli arka plan sayaçtan dikkat çalmamalı
- Animasyon azaltma seçeneği bulunmalı
- Kartlar ve metinler yeterli kontrasta sahip olmalı

---

# 6. Klavye Kısayolları

| Kısayol | Eylem |
|---|---|
| `Space` | Sayacı başlat / duraklat |
| `N` | Yeni görev ekle |
| `D` | Dikkat dağıtıcı not ekle |
| `I` | Kesinti kaydet |
| `P` | Proje seç |
| `T` | Görev seç |
| `M` | Ses panelini aç / kapat |
| `Ctrl/Cmd + K` | Komut paletini aç |
| `Esc` | Açık pencereyi kapat |

Kısayollar kullanıcı tarafından değiştirilebilir olmalıdır.

---

# 7. Geliştirme Aşamaları

## Aşama 1 — Temeli sağlamlaştır

### Hedef

Sayaç ve görev sistemini güvenilir hâle getirmek.

### Yapılacaklar

- [ ] Sayaç durumunu kalıcı olarak sakla
- [ ] Yenileme sonrası seansı geri yükle
- [ ] Uyku modu sonrası süre hesabını düzelt
- [ ] Aktif görev ve proje ilişkisini sağlamlaştır
- [ ] Masaüstü bildirimlerini ekle
- [ ] Sekme başlığında kalan süreyi göster
- [ ] Klavye kısayollarını ekle
- [ ] Mobil taşmaları düzelt
- [ ] CSV ve JSON dışa aktarma ekle

### Tamamlanma ölçütü

Kullanıcı bir seansı veri kaybı yaşamadan başlatıp tamamlayabiliyor olmalıdır.

---

## Aşama 2 — Ana odak döngüsü

### Hedef

Pomofree'yi basit sayaçtan gerçek bir odak aracına dönüştürmek.

### Yapılacaklar

- [ ] Görev Pomodoro tahmini
- [ ] Seans bitiş kriteri
- [ ] Seans sonu sonuç seçimi
- [ ] Dikkat dağıtıcı not kutusu
- [ ] Seans sonu odak / zorluk / enerji değerlendirmesi
- [ ] Kesinti günlüğü
- [ ] Acil başlama modu
- [ ] Akıllı mola önerileri

### Tamamlanma ölçütü

Her seans öncesi hedef, seans sırasındaki kesintiler ve seans sonrası sonuç kaydedilebilmelidir.

---

## Aşama 3 — Anlamlı raporlar

### Hedef

Kullanıcı verisini davranış değişikliğine yardımcı olacak içgörülere dönüştürmek.

### Yapılacaklar

- [ ] Tahmin / gerçekleşen süre karşılaştırması
- [ ] Başarılı seans oranı
- [ ] Saat bazlı odak analizi
- [ ] Kesinti sebepleri analizi
- [ ] Seans sırasına göre performans
- [ ] Proje bazında çalışma dağılımı
- [ ] Haftalık metinsel özet
- [ ] Rapor filtreleri

### Tamamlanma ölçütü

Rapor ekranı kullanıcıya en az bir somut ve açıklanabilir davranış önerisi sunmalıdır.

---

## Aşama 4 — Adaptif çalışma sistemi

### Hedef

Uygulamanın kullanıcıya uygun seans süresini ve çalışma düzenini önerebilmesi.

### Yapılacaklar

- [ ] Seans süresi öneri algoritması
- [ ] Öneri gerekçesi
- [ ] Kabul / ret takibi
- [ ] Proje ve görev türüne göre farklı öneriler
- [ ] Öneri sıklığı kontrolleri
- [ ] Kullanıcıya özel mola önerileri

### Tamamlanma ölçütü

Öneriler yeterli veriye dayanmalı ve kullanıcı tarafından tamamen kontrol edilebilmelidir.

---

## Aşama 5 — Benimle Çalış

### Hedef

Pomofree'nin sosyal odak özelliğini ürünün ana farklılaştırıcısı hâline getirmek.

### Yapılacaklar

- [ ] Özel oda oluşturma
- [ ] Davet bağlantısı ve kodu
- [ ] Senkronize sayaç
- [ ] Katılımcı durumları
- [ ] Yeniden bağlanma sistemi
- [ ] Molada sınırlı sohbet
- [ ] Anonim çalışma odaları
- [ ] Gizlilik seçenekleri
- [ ] Raporlarda sosyal seans ayrımı

### Tamamlanma ölçütü

En az iki kullanıcı aynı odada senkronize bir seansı sorunsuz tamamlayabilmelidir.

---

## Aşama 6 — Ses ve kişiselleştirme

### Hedef

Çalışma ortamını kişiselleştirmek.

### Yapılacaklar

- [ ] Odak ses mikseri
- [ ] Ses profilleri
- [ ] Proje bazlı ses seçimi
- [ ] Pomodoro ve mola ses geçişleri
- [ ] Tema kişiselleştirme
- [ ] Azaltılmış hareket modu
- [ ] Renk körlüğü seçenekleri

---

# 8. İlk Sürüm İçin Önerilen Kapsam

İlk güçlü sürümde aşağıdaki özellikler bulunmalıdır:

- Güvenilir sayaç
- Proje ve görev sistemi
- Görev başına Pomodoro tahmini
- Seans bitiş kriteri
- Dikkat dağıtıcı not kutusu
- Kesinti günlüğü
- Seans sonu değerlendirme
- Acil başlama modu
- Temel raporlar
- Veri dışa aktarma
- PWA desteği

İlk sürümde ertelenebilecekler:

- Anonim body doubling
- Gelişmiş yapay zekâ yorumları
- Karmaşık gamification
- Three.js tabanlı yoğun görsel efektler
- Çok ayrıntılı sosyal özellikler

---

# 9. Başarı Metrikleri

Ürünün başarısı yalnızca toplam odak dakikasıyla ölçülmemelidir.

Takip edilecek ana metrikler:

- Başlatılan seansların tamamlanma oranı
- Seans sonrası hedefe ulaşma oranı
- İlk görevden ilk seansa geçiş süresi
- Acil başlama modundan normal seansa dönüş oranı
- Haftalık aktif kullanıcı
- Kullanıcı başına tamamlanan görev
- Tahmin doğruluğundaki gelişim
- Kesinti sayısındaki değişim
- Dört hafta sonra geri dönen kullanıcı oranı
- Benimle Çalış odalarının tamamlanma oranı

---

# 10. Ürün Karar Prensibi

Yeni bir özellik eklenmeden önce şu sorular sorulmalıdır:

1. Kullanıcının işe başlamasını kolaylaştırıyor mu?
2. Kullanıcının odağını koruyor mu?
3. Kullanıcıya kendisi hakkında anlamlı bilgi veriyor mu?
4. Mevcut çalışma akışını gereksiz yere uzatıyor mu?
5. Bu özellik olmasa ürünün temel değeri azalır mı?
6. Özellik yalnızca güzel görünüyor diye mi ekleniyor?

Bir özellik bu sorulardan hiçbirine güçlü cevap vermiyorsa geliştirme listesine alınmamalıdır.

---

# 11. Kısa Yol Haritası

```text
1. Güvenilir sayaç ve veri sistemi
2. Görev tahmini ve seans hedefi
3. Dikkat dağıtıcılar ve kesintiler
4. Seans sonu değerlendirme
5. Anlamlı raporlar
6. Adaptif süre önerileri
7. Benimle Çalış
8. Ses mikseri ve kişiselleştirme
9. Gamification ve gelişmiş görsel efektler
```

Pomofree'nin önceliği daha fazla neon veya daha fazla animasyon değil; kullanıcının çalışmaya başlamasını, devam etmesini ve kendi çalışma biçimini anlamasını sağlayan güçlü bir sistem kurmak olmalıdır.
