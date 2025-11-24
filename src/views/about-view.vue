<template>
  <p
    class="text-slate-700 text-pretty indent-4 px-3 py-4 rounded-3xl bg-gradient-to-t from-slate-300 to-slate-200"
  >
  <center>بسمۀ تعالی</center>
  <div class="grid grid-rows-1 grid-cols-2 w-full items-center gap-2 my-4">

    <img
    src="@/../public/logotext-black-transparent-withboy.png"
    class="mx-auto"
    alt="nasim-mehr"
    />

    <img
    src="@/../public/meshkat.png"
    class="mx-auto"
    alt="nasim-mehr"
    />

  </div>
    گروه نرم افزاری مشکات زیرمجموعه شرکت صنایع خلاق نسیم مهر واقع در مشهد، مجموعه ای از دانشجویان و
    دانش آموزان خلاق و درحال پیشرفت است که میکوشند تا جزوی از رشد فناوریهای نرم افزاری در کشور
    باشند.
    <br />
    <br />
    <center class="font-medium">هوای دلتان همیشه صاف 🩵🌤</center>
  </p>
  <div class="grid grid-rows-1 grid-cols-4 w-full my-3 gap-3 mt-auto">
    <RouterLink
      :to="views.HOME"
      class="flex items-center justify-center flex-col bg-slate-300 rounded-xl py-2"
    >
      <ArrowRightIcon class="size-6 my-1" />
      بازگشت
    </RouterLink>
    <a
      href="https://www.nasim-mehr.ir"
      target="_blank"
      class="flex items-center justify-center flex-col bg-slate-300 rounded-xl py-2"
    >
      <GlobeAltIcon class="size-6 my-1" />
      وبسایت
    </a>
    <a
      href="https://eitaa.com/nmg_studio"
      class="flex items-center justify-center flex-col bg-slate-300 rounded-xl py-2"
    >
      <img src="@/../public/eitaa-icon.png" class="size-6 grayscale brightness-0 my-1" />
      کانال ایتا
    </a>
    <a
      href="https://Eitaa.com/nmg_admin"
      class="flex items-center justify-center flex-col bg-slate-300 rounded-xl py-2"
    >
      <UserGroupIcon class="size-6 my-1" />
      پشتیبانی
    </a>
  </div>
</template>

<script setup lang="ts">
import { views } from '@/router'
import { ArrowRightIcon, GlobeAltIcon, HomeIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
</script>
