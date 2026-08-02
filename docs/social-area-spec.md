# Sosyal Alan

## Amaç

Giriş yapan kullanıcı üst menüdeki **Sosyal** düğmesiyle `/social` sayfasına gider. Sayfa, Pomofree odak seanslarından haftalık topluluk sıralamalarını üretir; kullanıcılar kısa not paylaşabilir, tepki verebilir ve yorum bırakabilir.

## Kapsam

- Haftanın odak şampiyonları, seri tamamlayanları ve çok yönlüleri
- Kullanıcının yalnızca görünen adıyla yayınlanan haftalık profil özeti
- 30 gönderilik akış; en fazla 400 karakterlik not, dört ruh hâli ve üç tepki
- Gönderi başına istek üzerine yüklenen en fazla 40 yorum; yorum sınırı 240 karakter
- Gönderi/yorum silme yalnızca sahibine açık
- Tema değişkenlerine uyan responsive arayüz ve hareket azaltma tercihine saygılı canvas takımyıldızı
- Yerel kuş bitiş sesi ve gerçek kafe ortamı kaydı

## Veri ve Güvenlik

- `socialProfiles/{uid}`: haftalık dakika, seans, aktif gün ve proje sayısı; kullanıcı sadece kendi profilini yazar
- `socialPosts/{postId}` ve `socialPosts/{postId}/comments/{commentId}`: kimlik doğrulamalı okuma/yazma, alan ve uzunluk doğrulaması
- E-posta ve özel proje/görev içeriği sosyal alana yazılmaz
- Sorgular profil için 100, gönderi için 30, açık yorumlar için 40 kayıtla sınırlıdır
- Sıralama istemcide doğrulanmış Pomofree seanslarından türetilen, ödülsüz bir topluluk göstergesidir; hileye dayanıklı yarışma gerekirse güvenilir sunucu toplulaştırması eklenir

## Doğrulama

- `npm test -- --watchAll=false`
- `npm run build`
- Firestore emülatöründe yetki/uzunluk/sahiplik kuralları
- Giriş yapmış ve misafir akışlarıyla gerçek tarayıcı kontrolü
- `firebase deploy --only firestore:rules,hosting`
