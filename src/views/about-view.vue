<template>
  <div class="flex justify-center w-full items-center gap-2 mb-4 mt-auto pt-16 px-4">
    <img
      src="@/../public/logotext-black-transparent-withboy.png"
      class="mx-auto grayscale brightness-0 w-3/5"
      alt="nasim-mehr"
    />

    <!-- <span class="bg-slate-600 size-4 flex-none rounded-full"> </span> -->

    <img src="@/../public/meshkat.png" class="mx-auto grayscale w-2/5 brightness-0" alt="meshkat" />
  </div>
  <p class="text-slate-900 text-sm text-justify indent-1 px-3 py-4 rounded-3xl mb-auto">
    گروه نرم افزاری مشکات زیرمجموعه شرکت صنایع خلاق نسیم مهر واقع در مشهد، مجموعه ای از دانشجویان و
    دانش آموزان خلاق و درحال پیشرفت است که میکوشند تا جزوی از رشد فناوریهای نرم افزاری در کشور
    باشند.
    <br />
    <br />
    <strong class="font-medium">هوای دلتان همیشه صاف 🩵🌤</strong>
  </p>
  <div class="grid grid-rows-1 grid-cols-3 w-2/3 my-3 gap-3 mt-auto">
    <a
      href="https://www.nasim-mehr.ir"
      target="_blank"
      class="flex items-center justify-center flex-col border border-slate-700 rounded-xl py-2"
    >
      <GlobeAltIcon class="size-6 my-1" />
      وبسایت
    </a>
    <a
      href="https://eitaa.com/nmg_studio"
      class="flex items-center justify-center flex-col border border-slate-700 rounded-xl py-2"
    >
      <img src="@/../public/eitaa-icon.png" class="size-6 grayscale brightness-0 my-1" />
      کانال ایتا
    </a>
    <a
      href="https://Eitaa.com/nmg_admin"
      class="flex items-center justify-center flex-col border border-slate-700 rounded-xl py-2"
    >
      <UserGroupIcon class="size-6 my-1" />
      پشتیبانی
    </a>
  </div>
</template>

<script setup lang="ts">
import { GlobeAltIcon, UserGroupIcon } from '@heroicons/vue/24/outline'
</script>
