<?php

use Illuminate\Support\Facades\Route;

Route::redirect('/', '/app/', 302);
Route::view('/backend', 'welcome');
