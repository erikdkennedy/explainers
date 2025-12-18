---
title: How does Quantum Mechanics work?
subtitle: An intuitive & non-technical primer
nutshell: This article is a tangible, intuitive intro to quantum mechanics. It specifically avoids equations and jargon in favor of analogies and everyday wordings – yet is 100% scientifically accurate, to the best of my ability. It presumes you’re generally familiar with the sort of things that get talked about in high school physics, but you don’t have to remember any of the details.
toc: qm-toc.html
img_subdir: qm
img_on_homepage: quantum-background-sm.html
published_on: 2025-11-01
layout: post
css: quantum
js: post
tags: [posts]
published: false
---

I’ve spent over a year trying to piece together quantum mechanics, and this article is the result of my work. If you learn all the material in this article, you’ll know enough to be annoyed by just about _everyone_:
{ #introduction }

* _Science journalists_, with their jargon-laden buzzword bingo that imparts zero real understanding
* _Practicing quantum physicists_, who are largely surprisingly uninterested in the deeper meaning behind what we’ll cover below (“the math works, who cares!”)
* _Cocktail party dweebs_, who parrot the same misleading-to-false fantastic factoids, and now we’re all a little dumber

Look, I’m not against sounding smart at a cocktail party, but what I really want is to understand what quantum mechanics _is_. Not the official terms, not necessarily all the equations, but the _ideas behind it_. I want to be able to explain it with my hands, rambling on in an excited lecture, but a dirt-simple intuitive kind of lecture.

{% include img.md, src: "feynman.mp4", alt: "Richard Feynman explaining physics with his hands", caption: "This is what your hands should do when you explain physics. Patron saint 🫶", width: "400px" %}

One side-note before we begin: I’m avoiding the standard terminology of quantum mechanics (henceforth: “QM”) until the end. I feel that using someone else’s jargon is a way to import someone else’s thinking – which has its uses, but it was a hindrance in _my_ learning QM. At the end, there’s a big glossary tying everything you’ll learn to the “official” terminology. But before that, look out for metaphors and simplifications that favor clarity over exactness.

Physicists, you’ve been warned 😉

OK, enough pre-amble. Let’s dive right in.

As far as I can tell, basically _all_ of the weirdness of QM is due to _two simple facts_. Neither is intuitive to everyday life, but they’re the foundation of the quantum:

1. Probabilities can cancel
2. Things can split into many (potentially infinite) “phantom copies” of themselves*

{% aside %}
#### Well akshually... 🧐

I’ll use asides like this for more in-depth comments or technical clarifications. They’re entirely optional to read.

Here I’ll only note that the “many phantom copies” idea is:

1. Implied by some equations in QM
2. The most intuitive way to picture QM
3. Believed by many physicists to be what’s actually happening.

But! – it’s not a _requirement_ from the equations that you believe there are multiple copies of things, and I will, much later on, mention a few ways of interpreting QM that do not believe this.
{% endaside %}

Let’s talk about each of those.



## Probabilities can cancel {data-ordinal="I." #probabilities-can-cancel}

In day-to-day life, we understand that probabilities can _add_ and _multiply_.

For example, the probability of being born on a _weekend_ is the probability of being born on a Saturday _plus_ the probability of being born on a Sunday.

Or the probability of being born at 2:03 AM in July is (roughly) the probability of being born at 2:03 AM _times_ the probability of being born in July.

But in our normal, day-to-day experience, _probabilities never cancel_*.

{% aside %}
This implies that QM probabilities can be negative – which is true – but the full story is worse! In QM, probabilities are complex numbers, and can therefore cancel in many different ways (0.5 and -0.5 cancel; so can 0.5i and -0.5i, etc 😬).

That quantum probabilities can have an imaginary component is mathematically very mysterious, but for the purposes of today’s article, there’s no further insight to be gleaned from pondering it.

Sorry, stoners!
{% endaside %}

If they did, it would be weird in the extreme.

Consider a deck of cards in which (1) the probability of drawing a black card and (2) the probability of drawing a red card _cancelled each other out_. No matter what card you drew, it'd always end up being a joker.

Turn the deck face-up, inspect it – it's totally normal.

But shuffle and re-draw, and it's a Joker every time.

This would be absolutely brain-breaking to witness.

But you could imagine subtler versions. What if no one had ever been born at 2:03 AM in July? It might take a while to notice this phenomenon, but if this were an absolutely verifiably true fact about the universe, it should still cause an uproar.

The pattern with both of these (ridiculous) probability-cancelling analogies is the weirdness comes from what _doesn't_ happen. You never draw a suit card. You never see someone born at 2:03 AM in July. Most things may be pretty normal, but _some stuff just doesn't happen_.

QM is the same way. A lot of the weirdness comes from what just doesn't happen.

Perhaps the most famous quantum experiment of all time – one that helped get things kicked off – was the double slit experiment. You may've even seen the results:

{% include img.md, src: "single-slit-results-photo.png", alt: "Results of photons going through a single slit", caption: "Pattern of electrons shot at a screen through a <strong>single</strong> slit" %}

{% include img.md, src: "double-slit-results-photo.png", alt: "Results of photons going through a double slit", caption: "Pattern of electrons shot at a screen through <strong>two slits</strong>. Uh... why?" %}

{% inset %}
### What's the double-slit experiment?

This experiment is about shooting particles (like photons or electrons) – either en masse, or one at a time (it doesn't matter) – through either _one_ or _two_ tiny vertical slits.

If you put a screen behind the slit, you can measure where the most photons end up. In the images above, a brighter color means more photons landed there.

Let's talk about the results.

If there's just ONE slit, the experiment is pretty mundane. Most photons go straight through or bend a tiny bit (due to interactions with the atoms at the edges of the slit).

However, when you add a SECOND slit, the pattern gets unexpectedly complex. There's "banding" in which photons land even more in certain points – but, mysteriously, don't land at all in other places.

But given this happens even if you shoot the photons one at a time, how can merely adding a second slit create such a complex pattern? This defied all physics of its time.
{% endinset %}