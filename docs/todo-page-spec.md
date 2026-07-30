# Bağımsız Todo Sayfası

## Amaç

Giriş yapan kullanıcı üst menüdeki **Todo** düğmesiyle `/todo` sayfasına gider. Sayfa Microsoft To Do’nun akıllı listelerini, Trello’nun pano görünümünü ve Pomofree temalarını aynı görev verisi üzerinde birleştirir.

## Kapsam

- Akıllı listeler: Günüm, Önemli, Planlanan, Tümü, Tamamlananlar
- Kullanıcı listeleri/projeleri ve görev sayıları
- Liste ve pano görünümü
- Görev oluşturma, düzenleme, tamamlama/geri alma, önem, Günüm, son tarih, not, liste değiştirme ve silme
- Arama, boş/yükleniyor/hata durumları, klavye erişimi ve responsive düzen
- `users/{uid}/projects` ile `users/{uid}/tasks` Firestore yollarını yeniden kullanma
- Ana ekranda bugünkü ve bu haftaki odak süresini birlikte gösterme

## Sınırlar

- Yeni bağımlılık yok; mevcut React, Firebase ve CSS tema değişkenleri kullanılır
- Firebase/GitHub dağıtımı bu aşamada yapılmaz
- Paylaşım, dosya eki, hatırlatıcı bildirimi ve sürükle-bırak sonraya bırakılır
- Görev başlığı 200, not 2000, liste adı 80 karakterle sınırlıdır

## Doğrulama

- Todo filtre/veri doğrulama birim testleri
- Günlük/haftalık süre bileşen testi
- `npm test -- --watchAll=false`
- `npm run build`
- 320, 768, 1024 ve 1440 px gerçek tarayıcı kontrolü mümkün olduğunda
