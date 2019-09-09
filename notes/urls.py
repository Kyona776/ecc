from django.urls import path
import neomodel
from .views import Index, NoteCreateView, NoteDetailView, CategoryEditView, CategoryAutocomplete, category_detail
from .views import Category_mainView, Category_Create
app_name = 'notes'
urlpatterns = [
    #path('', IndexView.as_view(), name='index'),
    path('', Index, name='index'),
    path('create/', NoteCreateView, name='create'),
    path('<int:id>/detail/', NoteDetailView, name='detail'),

    path('category/', Category_mainView, name='category_main'),
    path('category/create/', Category_Create, name='category_create'),
    path('categories/editting/', CategoryEditView, name='categorize'),
    path('category/detail/<int:id>/',category_detail ,name='category_detail'),
    path('category-autocomplete/', CategoryAutocomplete.as_view(), name='category_autocomplete'),
    #path('search/', name='searchnotes'),
    ]