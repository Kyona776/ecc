from django.shortcuts import render, redirect
from django.http import request
from django.views import generic
import neomodel, neo4j
from .models.Notes import Notes 
from .models.Category import Categories, CategoryRel
from .form import SearchNotesForm, NoteEditingForm, CategoryForm, CategorizeForm
from dal import autocomplete
# Create your views here.
"""
class IndexView(generic.ListView):
    template_name = 'notes/index.html'
    model = Notes()
    #paginate_by = 5

    def get_queryset(self, queryset=None):
        return Notes.nodes.all
"""

def Index(request):
    neo4j_console = 'http://localhost:7474/browser/'
    form = SearchNotesForm(request.GET or None)
    if form.is_valid():
        result = [i for i in Notes.nodes.filter(note_title__icontains=form.cleaned_data['note_title'])]
        #return redirect('notes:index')
    else:
        result = None
    template_name = 'notes/index.html'
    latest_notes_list = Notes.nodes.all()[:-5:-1]
    context = {'latest_notes_list':latest_notes_list, 'search_form':form, 'result':result, 'neo4j_console':neo4j_console}
    return render(request, template_name, context)

def NoteCreateView(request):
    form = NoteEditingForm(request.POST or None)
    if form.is_valid():
        Notes(note_title=form.cleaned_data['note_title'],
        note_content=form.cleaned_data['note_content']
        ).save()

        return redirect('notes:index')
    return render(request, 'notes/create.html', {'form':form})

def NoteDetailView(request, id):
    note = Notes(id=id)
    note.refresh()
    form = NoteEditingForm(request.POST or None)
    if form.is_valid():
        note = Note(id=id)
        note.refresh()
        note(note_title=form.cleaned_data['note_title'],
        note_content=form.cleaned_data['note_content']
        ).save()

        redirect('notes:detail')
    return render(request, 'notes/note_detail.html', {'note':note, 'form':form})

def note_edit(request, id):
    form = NoteEditingForm(request.Post or None)
    if form.is_valid():
        note = Note(id=id)
        note.refresh()
        note()
    return render(request, 'notes/note_edit.html', {'note':note})

class CategoryAutocomplete(autocomplete.Select2QuerySetView):
    def get_queryset(self):
        if self.q:
            result = Categories.nodes.filter(note_title=self.q)
        
        return result




"""
category viesws
"""
def Category_mainView(request):
    categories = Categories.nodes.all()
    return render(request, 'notes/category/category.html', {'categories':categories})

def category_detail(request, id):
    form = CategoryForm(request.GET or None)

    if request.POST:
        if form.is_valid():
            category = Categories(id=id)
            category.refresh()
            rel = category.parent_category.connect(form.cleaned_data['category_name'],{'feature':form.cleaned_data['category_rel_feature']})
            rel.save()

    category = Categories(id=id)
    category.refresh()

    return render(request, 'notes/category/category_detail.html', {'category':category, 'form':form})

def Category_Create(request):
    form = CategoryForm(request.POST or None)
    if request.POST:
        if form.is_valid():
            category = Categories(category_name=form.cleaned_data['category_name']).save()
            
            return redirect('notes:category_main')
    return render(request, 'notes/category/category_create.html', {'form':form})

def CategoryEditView(request, id):
    if request.POST:
        form = CategoryForm(request.POST or None)
        if form.is_valid():
            if form.cleaned_data['category_name']:
                catego = Categories(category_name=form.cleaned_data['category_name'])
                if form.cleaned_data['cateogory_relate_to']:
                    catego.parent_category.connecct()
            if form.cleaned_data['cateogory_relate_to']:
                catego.parent_category.connecct()
        redirect('notes:category_detail', id=id)

def category_create(reques):
    form = CategoryForm(request.POST or None)
    if form.is_valid():
        category = Categories(category_name=form.cleaned_data['category_name'])
        category.save()
        c_id = category.id
    redirect('notes:category_detail', id = c_id)

def categorize(request, id):
    if request.POST:
        form = CategorizeForm(request.POST or None)
        if id:
            pass
    if request.GET:
        form = categorizeForm(request.GET or None)