<script setup>
const title = 'Billings | Real Stories About Navigating U.S. Healthcare'
const description = 'Billings shares real stories about healthcare access and connects patients and caregivers to practical, free resources they can use now.'

useSeoMeta({
  title,
  description,
  ogType: 'website',
  ogSiteName: 'Billings',
  ogLocale: 'en_US',
  ogTitle: title,
  ogDescription: description,
  ogImage: '/og-image.jpg',
  twitterTitle: title,
  twitterDescription: description,
  twitterImage: '/og-image.jpg',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
